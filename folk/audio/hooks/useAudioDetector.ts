/**
 * Axon Audio Mixer - Audio Detector Hook
 * Detects audio URLs in messages and triggers auto-play based on settings
 */

import { useEffect, useMemo, useRef } from "react"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import {
  activeAudioSessionAtom,
  audioSettingsAtom,
  createAudioSessionAtom,
  AudioTrack,
  AudioMixerSession
} from "../atoms/audioState"
import {
  parseAudioLinksFromText,
  extractMcpToolInfo,
  DetectedAudioLink
} from "../utils/audioUrlParser"

// ============================================================================
// Types
// ============================================================================

export interface UseAudioDetectorOptions {
  messageId: string
  chatId: string
  messageText: string
  isAssistantMessage: boolean
  isChatStreaming: boolean
}

export interface UseAudioDetectorResult {
  detectedAudioLinks: DetectedAudioLink[]
  hasAudio: boolean
  mcpToolName: string | null
  shouldAutoPlay: boolean
}

// ============================================================================
// Hook
// ============================================================================

export function useAudioDetector({
  messageId,
  chatId,
  messageText,
  isAssistantMessage,
  isChatStreaming
}: UseAudioDetectorOptions): UseAudioDetectorResult {
  const [activeSession, setActiveSession] = useAtom(activeAudioSessionAtom)
  const settings = useAtomValue(audioSettingsAtom)
  const createSession = useSetAtom(createAudioSessionAtom)

  // Track if we've already processed this message
  const processedRef = useRef<string | null>(null)

  // Detect audio links in the message
  const detectedAudioLinks = useMemo(() => {
    if (!isAssistantMessage) return []
    return parseAudioLinksFromText(messageText)
  }, [messageText, isAssistantMessage])

  // Extract MCP tool information
  const mcpToolInfo = useMemo(() => {
    if (!isAssistantMessage) return { toolName: null, serverName: null }
    return extractMcpToolInfo(messageText)
  }, [messageText, isAssistantMessage])

  const mcpToolName = mcpToolInfo.toolName

  // Determine if auto-play should be triggered
  const shouldAutoPlay = useMemo(() => {
    // Global setting must be enabled
    if (!settings.globalAutoPlayEnabled) return false

    // Must have audio links
    if (detectedAudioLinks.length === 0) return false

    // Must be assistant message
    if (!isAssistantMessage) return false

    // If we have MCP tool info, check its specific setting
    if (mcpToolName) {
      const toolSetting = settings.mcpToolSettings[mcpToolName]
      // If no specific setting exists, use default (disabled)
      if (!toolSetting) return false
      return toolSetting.autoPlayEnabled
    }

    // No MCP tool identified - don't auto-play by default
    return false
  }, [settings, detectedAudioLinks, isAssistantMessage, mcpToolName])

  // Create audio session when streaming completes and conditions are met
  useEffect(() => {
    // Don't process while streaming
    if (isChatStreaming) return

    // Don't process if no audio detected
    if (detectedAudioLinks.length === 0) return

    // Don't process if already processed this message
    if (processedRef.current === messageId) return

    // Don't process if auto-play is disabled
    if (!shouldAutoPlay) return

    // Don't create new session if one already exists for this message
    if (activeSession?.messageId === messageId) return

    // Mark as processed
    processedRef.current = messageId

    // Get default volume from settings
    const defaultVolume = mcpToolName
      ? (settings.mcpToolSettings[mcpToolName]?.defaultVolume ?? settings.defaultVolume)
      : settings.defaultVolume

    // Create tracks from detected audio links
    const tracks: AudioTrack[] = detectedAudioLinks.map((link, index) => ({
      id: `${messageId}-track-${index}`,
      url: link.url,
      label: link.displayLabel,
      messageId,
      chatId,
      volume: defaultVolume,
      isMuted: false,
      isSolo: false,
      isLoaded: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    }))

    // Create new mixer session
    createSession({
      chatId,
      messageId,
      mcpToolName: mcpToolName || 'unknown',
      tracks,
      isPlaying: false,
      masterVolume: 1,
      isMinimized: false
    })
  }, [
    isChatStreaming,
    detectedAudioLinks,
    shouldAutoPlay,
    messageId,
    chatId,
    mcpToolName,
    settings,
    activeSession,
    createSession
  ])

  return {
    detectedAudioLinks,
    hasAudio: detectedAudioLinks.length > 0,
    mcpToolName,
    shouldAutoPlay
  }
}

export default useAudioDetector
