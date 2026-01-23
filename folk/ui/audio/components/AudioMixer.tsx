/**
 * Axon Audio Mixer - Main Mixer Component
 * Combines all tracks with master controls in a floating panel
 */

import React, { useEffect, useState } from "react"
import { useAudioMixer } from "../hooks/useAudioMixer"
import AudioTrack from "./AudioTrack"
import MasterControls from "./MasterControls"
import AudioSettings from "./AudioSettings"

// ============================================================================
// Component
// ============================================================================

const AudioMixer: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)

  const {
    session,
    registerAudioRef,
    playAll,
    pauseAll,
    stopAll,
    resetAll,
    setTrackVolume,
    toggleTrackMute,
    toggleTrackSolo,
    setMasterVolume,
    closeSession,
    toggleMinimize
  } = useAudioMixer()

  // Auto-play when session is created
  useEffect(() => {
    if (session && !session.isPlaying && session.tracks.length > 0) {
      // Small delay to ensure all audio elements are registered
      const timer = setTimeout(() => {
        playAll()
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]) // Only trigger on new session, intentionally omitting playAll and session

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!session) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case " ": // Spacebar - toggle play/pause
          e.preventDefault()
          if (session.isPlaying) {
            pauseAll()
          } else {
            playAll()
          }
          break
        case "Escape": // Escape - close mixer
          closeSession()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [session, playAll, pauseAll, closeSession])

  // Don't render if no active session
  if (!session) {
    return null
  }

  return (
    <div className={`audio-mixer ${session.isMinimized ? "minimized" : ""}`}>
      {/* Master controls */}
      <MasterControls
        isPlaying={session.isPlaying}
        masterVolume={session.masterVolume}
        isMinimized={session.isMinimized}
        onPlay={playAll}
        onPause={pauseAll}
        onStop={stopAll}
        onReset={resetAll}
        onMasterVolumeChange={setMasterVolume}
        onToggleMinimize={toggleMinimize}
        onClose={closeSession}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Track list - hidden when minimized */}
      {!session.isMinimized && (
        <div className="audio-mixer-tracks">
          {session.tracks.map(track => (
            <AudioTrack
              key={track.id}
              track={track}
              masterVolume={session.masterVolume}
              onRegisterRef={registerAudioRef}
              onVolumeChange={setTrackVolume}
              onToggleMute={toggleTrackMute}
              onToggleSolo={toggleTrackSolo}
            />
          ))}
        </div>
      )}

      {/* MCP tool indicator */}
      <div className="audio-mixer-footer">
        <span className="audio-mixer-mcp-tool">
          via {session.mcpToolName}
        </span>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <AudioSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default AudioMixer
