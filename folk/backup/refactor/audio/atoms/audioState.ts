/**
 * Axon Audio Mixer - State Management
 * Jotai atoms for managing audio playback state
 */

import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// ============================================================================
// Types
// ============================================================================

/** Individual audio track state */
export interface AudioTrack {
  id: string
  url: string
  label: string         // drums, vocals, bass, other, etc.
  messageId: string
  chatId: string
  volume: number        // 0-1
  isMuted: boolean
  isSolo: boolean
  isLoaded: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  error: string | null
}

/** Audio mixer session state */
export interface AudioMixerSession {
  sessionId: string
  chatId: string
  messageId: string
  mcpToolName: string   // Which MCP tool generated this response
  tracks: AudioTrack[]
  isPlaying: boolean
  masterVolume: number
  isMinimized: boolean
  createdAt: number
}

/** MCP tool-specific audio settings */
export interface McpToolAudioSetting {
  autoPlayEnabled: boolean
  defaultVolume: number
}

/** Global audio settings stored in localStorage */
export interface AudioSettings {
  globalAutoPlayEnabled: boolean
  defaultVolume: number
  mcpToolSettings: Record<string, McpToolAudioSetting>
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  globalAutoPlayEnabled: true,
  defaultVolume: 0.8,
  mcpToolSettings: {}
}

const DEFAULT_MCP_TOOL_SETTING: McpToolAudioSetting = {
  autoPlayEnabled: false,  // Default: disabled for new MCP tools
  defaultVolume: 0.8
}

// ============================================================================
// Atoms
// ============================================================================

/** Current active audio mixer session */
export const activeAudioSessionAtom = atom<AudioMixerSession | null>(null)

/** Audio settings persisted in localStorage */
export const audioSettingsAtom = atomWithStorage<AudioSettings>(
  "axon-audio-settings",
  DEFAULT_AUDIO_SETTINGS
)

/** History of audio sessions (for potential future use) */
export const audioSessionHistoryAtom = atom<AudioMixerSession[]>([])

// ============================================================================
// Derived Atoms
// ============================================================================

/** Get the number of currently playing tracks */
export const playingTracksCountAtom = atom((get) => {
  const session = get(activeAudioSessionAtom)
  if (!session) {
    return 0
  }
  return session.tracks.filter(t => t.isPlaying && !t.isMuted).length
})

/** Check if any solo track is active */
export const hasSoloTrackAtom = atom((get) => {
  const session = get(activeAudioSessionAtom)
  if (!session) {
    return false
  }
  return session.tracks.some(t => t.isSolo)
})

/** Get audio setting for a specific MCP tool */
export const getMcpToolSettingAtom = atom(
  (get) => (mcpToolName: string): McpToolAudioSetting => {
    const settings = get(audioSettingsAtom)
    if (!settings.mcpToolSettings[mcpToolName]) {
      return DEFAULT_MCP_TOOL_SETTING
    }
    return settings.mcpToolSettings[mcpToolName]
  }
)

// ============================================================================
// Action Atoms
// ============================================================================

/** Update MCP tool audio setting */
export const setMcpToolSettingAtom = atom(
  null,
  (get, set, payload: { mcpToolName: string; setting: Partial<McpToolAudioSetting> }) => {
    const settings = get(audioSettingsAtom)
    const currentSetting = settings.mcpToolSettings[payload.mcpToolName] || DEFAULT_MCP_TOOL_SETTING

    set(audioSettingsAtom, {
      ...settings,
      mcpToolSettings: {
        ...settings.mcpToolSettings,
        [payload.mcpToolName]: {
          ...currentSetting,
          ...payload.setting
        }
      }
    })
  }
)

/** Create a new audio mixer session */
export const createAudioSessionAtom = atom(
  null,
  (get, set, payload: Omit<AudioMixerSession, "sessionId" | "createdAt">) => {
    const newSession: AudioMixerSession = {
      ...payload,
      sessionId: `session-${Date.now()}`,
      createdAt: Date.now()
    }
    set(activeAudioSessionAtom, newSession)
  }
)

/** Close the current audio session */
export const closeAudioSessionAtom = atom(
  null,
  (get, set) => {
    const session = get(activeAudioSessionAtom)
    if (session) {
      // Add to history before closing
      const history = get(audioSessionHistoryAtom)
      set(audioSessionHistoryAtom, [...history.slice(-9), session]) // Keep last 10
    }
    set(activeAudioSessionAtom, null)
  }
)

/** Update a specific track in the session */
export const updateTrackAtom = atom(
  null,
  (get, set, payload: { trackId: string; updates: Partial<AudioTrack> }) => {
    const session = get(activeAudioSessionAtom)
    if (!session) {
      return
    }

    set(activeAudioSessionAtom, {
      ...session,
      tracks: session.tracks.map(track =>
        track.id === payload.trackId
          ? { ...track, ...payload.updates }
          : track
      )
    })
  }
)

/** Update session-level properties */
export const updateSessionAtom = atom(
  null,
  (get, set, updates: Partial<AudioMixerSession>) => {
    const session = get(activeAudioSessionAtom)
    if (!session) {
      return
    }

    set(activeAudioSessionAtom, {
      ...session,
      ...updates
    })
  }
)
