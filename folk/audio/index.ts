/**
 * Axon Audio Mixer - Module Exports
 * Central export point for all audio mixer functionality
 */

// Components
export { default as AudioMixer } from "./components/AudioMixer"
export { default as AudioTrack } from "./components/AudioTrack"
export { default as MasterControls } from "./components/MasterControls"
export { default as AudioWatcher } from "./components/AudioWatcher"
export { default as AudioSettings } from "./components/AudioSettings"

// Hooks
export { useAudioMixer } from "./hooks/useAudioMixer"
export { useAudioDetector } from "./hooks/useAudioDetector"
export type { UseAudioMixerResult } from "./hooks/useAudioMixer"
export type { UseAudioDetectorOptions, UseAudioDetectorResult } from "./hooks/useAudioDetector"

// State
export {
  activeAudioSessionAtom,
  audioSettingsAtom,
  audioSessionHistoryAtom,
  playingTracksCountAtom,
  hasSoloTrackAtom,
  getMcpToolSettingAtom,
  setMcpToolSettingAtom,
  createAudioSessionAtom,
  closeAudioSessionAtom,
  updateTrackAtom,
  updateSessionAtom
} from "./atoms/audioState"
export type {
  AudioTrack as AudioTrackType,
  AudioMixerSession,
  McpToolAudioSetting,
  AudioSettings as AudioSettingsType
} from "./atoms/audioState"

// Utilities
export {
  isAudioUrl,
  extractLabelFromText,
  extractLabelFromUrl,
  getDisplayLabel,
  parseAudioLinksFromText,
  extractMcpToolInfo,
  isFromMcpTool,
  AUDIO_EXTENSIONS,
  KNOWN_AUDIO_LABELS,
  LABEL_DISPLAY_NAMES
} from "./utils/audioUrlParser"
export type { DetectedAudioLink, McpToolInfo } from "./utils/audioUrlParser"
