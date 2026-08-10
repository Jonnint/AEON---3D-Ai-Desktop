import { useState, useCallback, useMemo } from 'react'
import { Emotion } from '../../shared/types'
import { AvatarCanvas } from './components/AvatarCanvas'
import { StatusIndicator } from './components/StatusIndicator'
import { ControlOverlay } from './components/ControlOverlay'
import { useVoiceInteraction } from './hooks/useVoiceInteraction'
import { useConversation } from './hooks/useConversation'
import { LipSyncController } from './avatar/LipSyncController'
import MODEL_URL from './assets/model.vrm?url'
import './index.css'

function App() {
  const [emotion, setEmotion] = useState<Emotion>('neutral')
  const [gesture, setGesture] = useState<string>('none')
  const [animationState, setAnimationState] = useState<'idle' | 'talking'>('idle')
  const [lipSync, setLipSync] = useState<LipSyncController | null>(null)
  
  const { messages, addMessage } = useConversation()
  
  // Get the last AI message for the chat bubble
  const lastAiMessage = useMemo(() => {
    return [...messages].reverse().find(m => m.role === 'assistant')
  }, [messages])

  // Callbacks for Voice Interaction Hook
  const handleAudioNodeReady = useCallback((context: AudioContext, source: AudioNode) => {
    if (lipSync) {
      lipSync.connect(context, source)
    }
  }, [lipSync])

  const { status, errorMsg, startListening, stopListening } = useVoiceInteraction({
    onAudioNodeReady: handleAudioNodeReady,
    onAddMessage: addMessage,
    onEmotionChange: setEmotion,
    onGestureChange: setGesture,
    onAnimationStateChange: setAnimationState
  })

  const handleControllersReady = useCallback((controllers: { lipSync: LipSyncController }) => {
    setLipSync(controllers.lipSync)
  }, [])

  // Window click-through logic
  const handleMouseEnter = useCallback(() => {
    window.electronAPI.setIgnoreMouseEvents(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    // Only forward mouse events when not interacting with UI
    window.electronAPI.setIgnoreMouseEvents(true, { forward: true })
  }, [])

  return (
    <div 
      className="app-container"
      // Default to pass-through unless hovering specific elements
      onMouseEnter={handleMouseLeave} 
    >
      <AvatarCanvas 
        modelUrl={MODEL_URL}
        emotion={emotion}
        gesture={gesture}
        animationState={animationState}
        onControllersReady={handleControllersReady}
      />
      
      {/* Invisible Drag Zone for the Avatar */}
      <div 
        className="avatar-drag-zone"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Klik dan geser untuk memindahkan Airi"
      />

      <div className="ui-layer">
        <StatusIndicator status={status} errorMsg={errorMsg} />
        
        <ControlOverlay 
          status={status}
          lastAiMessage={lastAiMessage}
          onStartListening={startListening}
          onStopListening={stopListening}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  )
}

export default App
