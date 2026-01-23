/**
 * Axon Audio Mixer - URL Parser Utility
 * Detects and parses audio URLs from message text
 */

// ============================================================================
// Constants
// ============================================================================

/** Supported audio file extensions */
export const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac', '.webm']

/** Known audio track labels for stem separation */
export const KNOWN_AUDIO_LABELS: Record<string, string[]> = {
  drums: ['drum', 'drums', '드럼', 'percussion'],
  vocals: ['vocal', 'vocals', '보컬', '목소리', 'voice', 'singing'],
  bass: ['bass', '베이스', 'bassline'],
  other: ['other', '기타', '나머지', 'accompaniment', 'inst', 'instrumental', '반주'],
  piano: ['piano', '피아노', 'keys', 'keyboard'],
  guitar: ['guitar', '기타악기', 'acoustic', 'electric']
}

/** Label display names (for UI) */
export const LABEL_DISPLAY_NAMES: Record<string, string> = {
  drums: 'Drums',
  vocals: 'Vocals',
  bass: 'Bass',
  other: 'Other',
  piano: 'Piano',
  guitar: 'Guitar'
}

// ============================================================================
// Types
// ============================================================================

/** Detected audio link information */
export interface DetectedAudioLink {
  url: string
  label: string
  displayLabel: string
  linkText: string
}

/** MCP tool call information extracted from message */
export interface McpToolInfo {
  toolName: string | null
  serverName: string | null
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Check if a URL points to an audio file
 */
export function isAudioUrl(url: string): boolean {
  const lowered = url.toLowerCase()
  return AUDIO_EXTENSIONS.some(ext => {
    // Check if URL ends with extension or has extension before query params
    return lowered.endsWith(ext) || lowered.includes(ext + '?') || lowered.includes(ext + '#')
  })
}

/**
 * Extract label from link text based on known keywords
 */
export function extractLabelFromText(text: string): string | null {
  const lowered = text.toLowerCase()

  for (const [label, keywords] of Object.entries(KNOWN_AUDIO_LABELS)) {
    if (keywords.some(kw => lowered.includes(kw))) {
      return label
    }
  }

  return null
}

/**
 * Extract label from URL path
 */
export function extractLabelFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Try to extract filename without extension
    const match = pathname.match(/\/([^\/]+)\.(wav|mp3|ogg|flac|m4a|aac|webm)$/i)
    if (match) {
      const filename = match[1].toLowerCase()

      // Check if filename matches any known label
      for (const [label, keywords] of Object.entries(KNOWN_AUDIO_LABELS)) {
        if (keywords.some(kw => filename.includes(kw))) {
          return label
        }
      }

      // Return cleaned filename as label
      return match[1].replace(/[-_]/g, ' ')
    }

    return 'Track'
  } catch {
    return 'Track'
  }
}

/**
 * Get display label for a label key
 */
export function getDisplayLabel(label: string): string {
  return LABEL_DISPLAY_NAMES[label] || label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Parse audio links from message text (Markdown format)
 */
export function parseAudioLinksFromText(text: string): DetectedAudioLink[] {
  const results: DetectedAudioLink[] = []

  // Pattern 1: Markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g
  let match

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const [, linkText, url] = match

    if (isAudioUrl(url)) {
      const label = extractLabelFromText(linkText) || extractLabelFromUrl(url)
      results.push({
        url,
        label,
        displayLabel: getDisplayLabel(label),
        linkText
      })
    }
  }

  // Pattern 2: Bare URLs that might be audio files
  const bareUrlRegex = /(?<!\()https?:\/\/[^\s<>"\)]+\.(wav|mp3|ogg|flac|m4a|aac|webm)(?:\?[^\s<>"]*)?/gi

  while ((match = bareUrlRegex.exec(text)) !== null) {
    const url = match[0]

    // Check if this URL was already captured as a markdown link
    if (!results.some(r => r.url === url)) {
      const label = extractLabelFromUrl(url)
      results.push({
        url,
        label,
        displayLabel: getDisplayLabel(label),
        linkText: label
      })
    }
  }

  return results
}

/**
 * Extract MCP tool information from message text
 * Looks for tool-call XML elements in the message
 */
export function extractMcpToolInfo(text: string): McpToolInfo {
  // Pattern: <tool-call toolkey=X name="toolName">
  // Tool name may be a single name like "isolate_vocals" or comma-separated like "isolate_vocals, demucs"
  const toolCallMatch = text.match(/<tool-call[^>]*\sname="([^"]+)"/)

  if (toolCallMatch) {
    const fullName = toolCallMatch[1]

    // Handle comma-separated tool names - take the first one
    // e.g., "isolate_vocals, isolate_drums" -> "isolate_vocals"
    const firstTool = fullName.split(',')[0].trim()

    // Return the tool name as-is (don't split by underscore - that's part of the name)
    return {
      serverName: null,
      toolName: firstTool
    }
  }

  // Alternative: look for "도구 호출" or similar patterns in Korean UI
  // Pattern handles comma-separated tool names like "isolate_vocals, isolate_drums 도구 호출"
  const koreanToolMatch = text.match(/🛠\s*([a-zA-Z0-9_-]+)(?:[,\s]|$)/)
  if (koreanToolMatch) {
    // Extract just the first tool name (before any comma or space)
    const toolName = koreanToolMatch[1].replace(/,+$/, "")
    return {
      serverName: null,
      toolName: toolName
    }
  }

  // Also try to match tool-call result pattern
  const toolResultMatch = text.match(/도구 호출 결과/)
  if (toolResultMatch) {
    // Try to extract tool name from the line containing 🛠
    const toolLineMatch = text.match(/🛠\s*([a-zA-Z0-9_-]+)/)
    if (toolLineMatch) {
      return {
        serverName: null,
        toolName: toolLineMatch[1]
      }
    }
  }

  return {
    serverName: null,
    toolName: null
  }
}

/**
 * Check if audio links belong to a specific MCP tool response
 */
export function isFromMcpTool(text: string, targetToolName: string): boolean {
  const toolInfo = extractMcpToolInfo(text)

  if (!toolInfo.toolName) return false

  // Check if the tool name matches (case insensitive)
  const lowerTarget = targetToolName.toLowerCase()
  const lowerTool = toolInfo.toolName.toLowerCase()

  return lowerTool.includes(lowerTarget) || lowerTarget.includes(lowerTool)
}
