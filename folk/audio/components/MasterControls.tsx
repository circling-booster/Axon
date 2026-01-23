/**
 * Axon Audio Mixer - Master Controls Component
 * Play/Pause, Stop, Reset, and Master Volume controls
 */

import React, { useCallback } from "react"

// ============================================================================
// Types
// ============================================================================

interface MasterControlsProps {
  isPlaying: boolean
  masterVolume: number
  isMinimized: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onReset: () => void
  onMasterVolumeChange: (volume: number) => void
  onToggleMinimize: () => void
  onClose: () => void
  onOpenSettings: () => void
}

// ============================================================================
// Component
// ============================================================================

const MasterControls: React.FC<MasterControlsProps> = ({
  isPlaying,
  masterVolume,
  isMinimized,
  onPlay,
  onPause,
  onStop,
  onReset,
  onMasterVolumeChange,
  onToggleMinimize,
  onClose,
  onOpenSettings
}) => {
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }, [isPlaying, onPlay, onPause])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMasterVolumeChange(parseFloat(e.target.value))
  }, [onMasterVolumeChange])

  return (
    <div className="audio-mixer-master-controls">
      {/* Header with title and window controls */}
      <div className="audio-mixer-header">
        <span className="audio-mixer-title">Audio Mixer</span>
        <div className="audio-mixer-window-controls">
          <button
            className="audio-mixer-window-btn settings-btn"
            onClick={onOpenSettings}
            title="Audio Settings"
          >
            ⚙
          </button>
          <button
            className="audio-mixer-window-btn minimize-btn"
            onClick={onToggleMinimize}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
          <button
            className="audio-mixer-window-btn close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main controls - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Playback controls */}
          <div className="audio-mixer-playback-controls">
            <button
              className={`audio-mixer-btn play-pause-btn ${isPlaying ? 'playing' : ''}`}
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              className="audio-mixer-btn stop-btn"
              onClick={onStop}
              title="Stop"
            >
              ⏹
            </button>
            <button
              className="audio-mixer-btn reset-btn"
              onClick={onReset}
              title="Reset to beginning"
            >
              ⏮
            </button>
          </div>

          {/* Master volume control */}
          <div className="audio-mixer-master-volume">
            <label className="audio-mixer-master-volume-label">Master</label>
            <input
              type="range"
              className="audio-mixer-master-volume-slider"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={handleVolumeChange}
              title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
            />
            <span className="audio-mixer-master-volume-value">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(MasterControls)
