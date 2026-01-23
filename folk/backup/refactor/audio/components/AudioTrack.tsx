/**
 * Axon Audio Mixer - Audio Track Component
 * Individual track with volume, mute, and solo controls
 */

import React, { useRef, useEffect, useState, useCallback } from "react"
import { AudioTrack as AudioTrackType } from "../atoms/audioState"

// ============================================================================
// Types
// ============================================================================

interface AudioTrackProps {
  track: AudioTrackType
  masterVolume: number
  onRegisterRef: (trackId: string, audio: HTMLAudioElement | null) => void
  onVolumeChange: (trackId: string, volume: number) => void
  onToggleMute: (trackId: string) => void
  onToggleSolo: (trackId: string) => void
  onTimeUpdate?: (trackId: string, currentTime: number, duration: number) => void
  onLoadedMetadata?: (trackId: string, duration: number) => void
  onError?: (trackId: string, error: string) => void
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) {
    return "0:00"
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// ============================================================================
// Component
// ============================================================================

const AudioTrack: React.FC<AudioTrackProps> = ({
  track,
  masterVolume,
  onRegisterRef,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onTimeUpdate,
  onLoadedMetadata,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [_isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Register audio element
  useEffect(() => {
    onRegisterRef(track.id, audioRef.current)
    return () => onRegisterRef(track.id, null)
  }, [track.id, onRegisterRef])

  // Update volume when track volume or master volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = track.volume * masterVolume
    }
  }, [track.volume, masterVolume])

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setIsLoaded(true)
      onLoadedMetadata?.(track.id, audioRef.current.duration)
    }
  }, [track.id, onLoadedMetadata])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      onTimeUpdate?.(track.id, audioRef.current.currentTime, audioRef.current.duration)
    }
  }, [track.id, onTimeUpdate])

  const handleError = useCallback(() => {
    const errorMsg = "Failed to load audio"
    setError(errorMsg)
    onError?.(track.id, errorMsg)
  }, [track.id, onError])

  const handleCanPlay = useCallback(() => {
    setError(null)
    setIsLoaded(true)
  }, [])

  // Retry loading the audio
  const handleRetry = useCallback(() => {
    if (audioRef.current) {
      setError(null)
      // Force reload by updating src
      const currentSrc = audioRef.current.src
      audioRef.current.src = ""
      audioRef.current.src = currentSrc
      audioRef.current.load()
    }
  }, [])

  // Progress calculation
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`audio-track ${track.isMuted ? "muted" : ""} ${track.isSolo ? "solo" : ""}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={track.url}
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onCanPlay={handleCanPlay}
      />

      {/* Track header */}
      <div className="audio-track-header">
        <span className="audio-track-label">{track.label}</span>
        <span className="audio-track-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Error display with retry and link */}
      {error && (
        <div className="audio-track-error">
          {error}
          <button
            className="audio-track-retry-btn"
            onClick={handleRetry}
            title="Retry loading"
          >
            ↻
          </button>
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="audio-track-link-btn"
            title="Open in browser (may fix loading)"
            onClick={(e) => e.stopPropagation()}
          >
            ↗
          </a>
        </div>
      )}

      {/* Progress bar */}
      <div className="audio-track-progress">
        <div
          className="audio-track-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="audio-track-controls">
        {/* Mute button */}
        <button
          className={`audio-track-btn audio-track-mute-btn ${track.isMuted ? "active" : ""}`}
          onClick={() => onToggleMute(track.id)}
          title={track.isMuted ? "Unmute" : "Mute"}
        >
          M
        </button>

        {/* Solo button */}
        <button
          className={`audio-track-btn audio-track-solo-btn ${track.isSolo ? "active" : ""}`}
          onClick={() => onToggleSolo(track.id)}
          title={track.isSolo ? "Unsolo" : "Solo"}
        >
          S
        </button>

        {/* Volume slider */}
        <input
          type="range"
          className="audio-track-volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={track.volume}
          onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
          title={`Volume: ${Math.round(track.volume * 100)}%`}
        />

        {/* Volume value display */}
        <span className="audio-track-volume-value">
          {Math.round(track.volume * 100)}%
        </span>
      </div>
    </div>
  )
}

export default React.memo(AudioTrack)
