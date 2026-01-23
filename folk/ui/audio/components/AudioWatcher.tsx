/**
 * Axon Audio Mixer - Audio Watcher Component
 * Monitors messages for audio URLs and triggers audio session creation
 * Place this component at the Chat level to watch for audio content
 */

import { useEffect, useRef } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import {
  activeAudioSessionAtom,
  audioSettingsAtom,
  createAudioSessionAtom,
  AudioTrack
} from "../atoms/audioState"
import {
  parseAudioLinksFromText,
  extractMcpToolInfo
} from "../utils/audioUrlParser"

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string
  text: string
  isSent: boolean
}

export interface AudioWatcherProps {
  messages: Message[]
  chatId: string
  isChatStreaming: boolean
}

// ============================================================================
// Component
// ============================================================================

const AudioWatcher: React.FC<AudioWatcherProps> = ({
  messages,
  chatId,
  isChatStreaming
}) => {
  const activeSession = useAtomValue(activeAudioSessionAtom)
  const settings = useAtomValue(audioSettingsAtom)
  const createSession = useSetAtom(createAudioSessionAtom)

  // Track which message IDs have been processed
  const processedMessageIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Debug logging
    console.log("[AudioWatcher] useEffect triggered", {
      messagesCount: messages.length,
      chatId,
      isChatStreaming,
      settingsLoaded: !!settings
    })

    // Don't process while streaming
    if (isChatStreaming) {
      console.log("[AudioWatcher] Skipping - chat is streaming")
      return
    }

    // Find the last assistant message
    const lastAssistantMessage = [...messages]
      .reverse()
      .find(m => !m.isSent)

    if (!lastAssistantMessage) {
      console.log("[AudioWatcher] Skipping - no assistant message found")
      return
    }

    console.log("[AudioWatcher] Last assistant message:", {
      id: lastAssistantMessage.id,
      textPreview: lastAssistantMessage.text?.substring(0, 200)
    })

    // Check if already processed
    if (processedMessageIds.current.has(lastAssistantMessage.id)) {
      console.log("[AudioWatcher] Skipping - already processed:", lastAssistantMessage.id)
      return
    }

    // Parse audio links from the message
    const audioLinks = parseAudioLinksFromText(lastAssistantMessage.text)
    console.log("[AudioWatcher] Audio links found:", audioLinks.length, audioLinks)

    if (audioLinks.length === 0) {
      console.log("[AudioWatcher] Skipping - no audio links")
      return
    }

    // Extract MCP tool info
    const mcpToolInfo = extractMcpToolInfo(lastAssistantMessage.text)
    const mcpToolName = mcpToolInfo.toolName
    console.log("[AudioWatcher] MCP tool info:", mcpToolInfo)

    // Check settings
    if (!settings.globalAutoPlayEnabled) {
      console.log("[AudioWatcher] Skipping - globalAutoPlayEnabled is false")
      return
    }

    // Check MCP tool-specific settings
    if (mcpToolName) {
      const toolSetting = settings.mcpToolSettings[mcpToolName]
      console.log("[AudioWatcher] Tool setting for", mcpToolName, ":", toolSetting)
      if (!toolSetting || !toolSetting.autoPlayEnabled) {
        console.log("[AudioWatcher] Skipping - tool auto-play not enabled")
        return
      }
    } else {
      // No MCP tool identified - don't auto-play by default
      console.log("[AudioWatcher] Skipping - no MCP tool identified")
      return
    }

    // Don't create new session if one already exists for this message
    if (activeSession?.messageId === lastAssistantMessage.id) {
      console.log("[AudioWatcher] Skipping - session already exists for this message")
      return
    }

    console.log("[AudioWatcher] Creating audio session!")

    // Mark as processed
    processedMessageIds.current.add(lastAssistantMessage.id)

    // Get default volume from settings
    const defaultVolume = mcpToolName
      ? (settings.mcpToolSettings[mcpToolName]?.defaultVolume ?? settings.defaultVolume)
      : settings.defaultVolume

    // Create tracks from detected audio links
    const tracks: AudioTrack[] = audioLinks.map((link, index) => ({
      id: `${lastAssistantMessage.id}-track-${index}`,
      url: link.url,
      label: link.displayLabel,
      messageId: lastAssistantMessage.id,
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
      messageId: lastAssistantMessage.id,
      mcpToolName: mcpToolName || 'unknown',
      tracks,
      isPlaying: false,
      masterVolume: 1,
      isMinimized: false
    })
  }, [
    messages,
    chatId,
    isChatStreaming,
    settings,
    activeSession,
    createSession
  ])

  // Clear processed messages when chat changes
  useEffect(() => {
    processedMessageIds.current.clear()
  }, [chatId])

  // This component doesn't render anything
  return null
}

export default AudioWatcher
