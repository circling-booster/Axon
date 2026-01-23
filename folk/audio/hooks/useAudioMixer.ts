/**
 * Axon Audio Mixer - Mixer Control Hook
 * Manages audio playback, volume, mute, and solo controls
 */

import { useCallback, useRef, useEffect } from "react"
import { useAtom, useSetAtom } from "jotai"
import {
  activeAudioSessionAtom,
  closeAudioSessionAtom,
  updateTrackAtom,
  updateSessionAtom,
  AudioTrack
} from "../atoms/audioState"

// ============================================================================
// Types
// ============================================================================

export interface UseAudioMixerResult {
  session: ReturnType<typeof useAtom<typeof activeAudioSessionAtom>>[0]
  registerAudioRef: (trackId: string, audio: HTMLAudioElement | null) => void
  playAll: () => Promise<void>
  pauseAll: () => void
  stopAll: () => void
  resetAll: () => void
  setTrackVolume: (trackId: string, volume: number) => void
  toggleTrackMute: (trackId: string) => void
  toggleTrackSolo: (trackId: string) => void
  setMasterVolume: (volume: number) => void
  closeSession: () => void
  toggleMinimize: () => void
  seekAll: (time: number) => void
}

// ============================================================================
// Hook
// ============================================================================

export function useAudioMixer(): UseAudioMixerResult {
  const [session, setSession] = useAtom(activeAudioSessionAtom)
  const closeSessionAtom = useSetAtom(closeAudioSessionAtom)
  const updateTrack = useSetAtom(updateTrackAtom)
  const updateSession = useSetAtom(updateSessionAtom)

  // Store references to audio elements
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Register audio element reference
  const registerAudioRef = useCallback((trackId: string, audio: HTMLAudioElement | null) => {
    if (audio) {
      audioRefs.current.set(trackId, audio)
    } else {
      audioRefs.current.delete(trackId)
    }
  }, [])

  // Play all tracks simultaneously
  const playAll = useCallback(async () => {
    if (!session) return

    const hasSolo = session.tracks.some(t => t.isSolo)
    const playPromises: Promise<void>[] = []

    session.tracks.forEach(track => {
      const audio = audioRefs.current.get(track.id)
      if (!audio) return

      // Determine if this track should play
      const shouldPlay = hasSolo
        ? track.isSolo && !track.isMuted
        : !track.isMuted

      if (shouldPlay) {
        playPromises.push(
          audio.play().catch(err => {
            console.warn(`Failed to play track ${track.label}:`, err)
            updateTrack({ trackId: track.id, updates: { error: 'Playback failed' } })
          })
        )
      }
    })

    await Promise.all(playPromises)
    updateSession({ isPlaying: true })
  }, [session, updateSession, updateTrack])

  // Pause all tracks
  const pauseAll = useCallback(() => {
    if (!session) return

    session.tracks.forEach(track => {
      const audio = audioRefs.current.get(track.id)
      if (audio) {
        audio.pause()
      }
    })

    updateSession({ isPlaying: false })
  }, [session, updateSession])

  // Stop all tracks (pause and reset to beginning)
  const stopAll = useCallback(() => {
    if (!session) return

    session.tracks.forEach(track => {
      const audio = audioRefs.current.get(track.id)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })

    updateSession({ isPlaying: false })
  }, [session, updateSession])

  // Reset all tracks to beginning
  const resetAll = useCallback(() => {
    if (!session) return

    session.tracks.forEach(track => {
      const audio = audioRefs.current.get(track.id)
      if (audio) {
        audio.currentTime = 0
      }
      updateTrack({ trackId: track.id, updates: { currentTime: 0 } })
    })
  }, [session, updateTrack])

  // Seek all tracks to a specific time
  const seekAll = useCallback((time: number) => {
    if (!session) return

    session.tracks.forEach(track => {
      const audio = audioRefs.current.get(track.id)
      if (audio && audio.duration) {
        audio.currentTime = Math.min(time, audio.duration)
      }
    })
  }, [session])

  // Set individual track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const audio = audioRefs.current.get(trackId)
    if (audio && session) {
      audio.volume = volume * session.masterVolume
    }
    updateTrack({ trackId, updates: { volume } })
  }, [session, updateTrack])

  // Toggle track mute
  const toggleTrackMute = useCallback((trackId: string) => {
    if (!session) return

    const track = session.tracks.find(t => t.id === trackId)
    if (!track) return

    const audio = audioRefs.current.get(trackId)
    if (audio) {
      audio.muted = !track.isMuted
    }

    updateTrack({ trackId, updates: { isMuted: !track.isMuted } })
  }, [session, updateTrack])

  // Toggle track solo
  const toggleTrackSolo = useCallback((trackId: string) => {
    if (!session) return

    const track = session.tracks.find(t => t.id === trackId)
    if (!track) return

    const newIsSolo = !track.isSolo

    // Update solo state for this track
    updateTrack({ trackId, updates: { isSolo: newIsSolo } })

    // If enabling solo, disable solo on other tracks
    if (newIsSolo) {
      session.tracks.forEach(t => {
        if (t.id !== trackId && t.isSolo) {
          updateTrack({ trackId: t.id, updates: { isSolo: false } })
        }
      })
    }

    // Update audio muting based on solo state
    const hasSoloAfter = newIsSolo || session.tracks.some(t => t.id !== trackId && t.isSolo)

    session.tracks.forEach(t => {
      const audio = audioRefs.current.get(t.id)
      if (audio) {
        if (hasSoloAfter) {
          // Mute non-solo tracks (unless explicitly muted)
          const isSoloTrack = t.id === trackId ? newIsSolo : t.isSolo
          audio.muted = !isSoloTrack || t.isMuted
        } else {
          // No solo active, restore original mute state
          audio.muted = t.isMuted
        }
      }
    })
  }, [session, updateTrack])

  // Set master volume
  const setMasterVolume = useCallback((masterVolume: number) => {
    if (!session) return

    // Update all audio element volumes
    session.tracks.forEach(track => {
      const audio = audioRefs.current.get(track.id)
      if (audio) {
        audio.volume = track.volume * masterVolume
      }
    })

    updateSession({ masterVolume })
  }, [session, updateSession])

  // Close the mixer session
  const closeSession = useCallback(() => {
    pauseAll()
    audioRefs.current.clear()
    closeSessionAtom()
  }, [pauseAll, closeSessionAtom])

  // Toggle minimize state
  const toggleMinimize = useCallback(() => {
    if (!session) return
    updateSession({ isMinimized: !session.isMinimized })
  }, [session, updateSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause()
      })
      audioRefs.current.clear()
    }
  }, [])

  return {
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
    toggleMinimize,
    seekAll
  }
}

export default useAudioMixer
