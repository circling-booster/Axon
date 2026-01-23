/**
 * Axon Audio Mixer - Settings Panel
 * Configure auto-play settings for MCP tools
 */

import React, { useState } from "react"
import { useAtom } from "jotai"
import { audioSettingsAtom, McpToolAudioSetting } from "../atoms/audioState"

// ============================================================================
// Types
// ============================================================================

interface AudioSettingsProps {
  onClose: () => void
}

// Common MCP tools that might produce audio
const COMMON_AUDIO_TOOLS = [
  "isolate_vocals",
  "isolate_drums",
  "isolate_bass",
  "isolate_other",
  "demucs",
  "separate_tracks",
  "extract_audio"
]

// ============================================================================
// Component
// ============================================================================

const AudioSettings: React.FC<AudioSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useAtom(audioSettingsAtom)
  const [newToolName, setNewToolName] = useState("")

  // Get list of configured tools
  const configuredTools = Object.keys(settings.mcpToolSettings)

  // Merge common tools with configured tools (no duplicates)
  const allTools = [...new Set([...COMMON_AUDIO_TOOLS, ...configuredTools])]

  const handleGlobalToggle = () => {
    setSettings({
      ...settings,
      globalAutoPlayEnabled: !settings.globalAutoPlayEnabled
    })
  }

  const handleDefaultVolumeChange = (volume: number) => {
    setSettings({
      ...settings,
      defaultVolume: volume
    })
  }

  const handleToolToggle = (toolName: string) => {
    const currentSetting = settings.mcpToolSettings[toolName] || {
      autoPlayEnabled: false,
      defaultVolume: settings.defaultVolume
    }

    setSettings({
      ...settings,
      mcpToolSettings: {
        ...settings.mcpToolSettings,
        [toolName]: {
          ...currentSetting,
          autoPlayEnabled: !currentSetting.autoPlayEnabled
        }
      }
    })
  }

  const handleToolVolumeChange = (toolName: string, volume: number) => {
    const currentSetting = settings.mcpToolSettings[toolName] || {
      autoPlayEnabled: false,
      defaultVolume: settings.defaultVolume
    }

    setSettings({
      ...settings,
      mcpToolSettings: {
        ...settings.mcpToolSettings,
        [toolName]: {
          ...currentSetting,
          defaultVolume: volume
        }
      }
    })
  }

  const handleAddTool = () => {
    if (newToolName.trim() && !settings.mcpToolSettings[newToolName.trim()]) {
      setSettings({
        ...settings,
        mcpToolSettings: {
          ...settings.mcpToolSettings,
          [newToolName.trim()]: {
            autoPlayEnabled: true,
            defaultVolume: settings.defaultVolume
          }
        }
      })
      setNewToolName("")
    }
  }

  const handleRemoveTool = (toolName: string) => {
    const { [toolName]: removed, ...rest } = settings.mcpToolSettings
    setSettings({
      ...settings,
      mcpToolSettings: rest
    })
  }

  const getToolSetting = (toolName: string): McpToolAudioSetting => {
    return settings.mcpToolSettings[toolName] || {
      autoPlayEnabled: false,
      defaultVolume: settings.defaultVolume
    }
  }

  return (
    <div className="audio-settings-overlay" onClick={onClose}>
      <div className="audio-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="audio-settings-header">
          <h3>Audio Auto-Play Settings</h3>
          <button className="audio-settings-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="audio-settings-content">
          {/* Global Settings */}
          <div className="audio-settings-section">
            <h4>Global Settings</h4>

            <div className="audio-settings-row">
              <span>Enable Auto-Play</span>
              <label className="audio-settings-toggle">
                <input
                  type="checkbox"
                  checked={settings.globalAutoPlayEnabled}
                  onChange={handleGlobalToggle}
                />
                <span className="audio-settings-toggle-slider" />
              </label>
            </div>

            <div className="audio-settings-row">
              <span>Default Volume</span>
              <div className="audio-settings-volume">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.defaultVolume}
                  onChange={(e) => handleDefaultVolumeChange(parseFloat(e.target.value))}
                />
                <span>{Math.round(settings.defaultVolume * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Per-Tool Settings */}
          <div className="audio-settings-section">
            <h4>MCP Tool Settings</h4>
            <p className="audio-settings-hint">
              Enable auto-play for specific MCP tools. Only enabled tools will auto-play audio.
            </p>

            <div className="audio-settings-tools-list">
              {allTools.map((toolName) => {
                const toolSetting = getToolSetting(toolName)
                const isConfigured = toolName in settings.mcpToolSettings

                return (
                  <div key={toolName} className="audio-settings-tool-item">
                    <div className="audio-settings-tool-header">
                      <label className="audio-settings-toggle">
                        <input
                          type="checkbox"
                          checked={toolSetting.autoPlayEnabled}
                          onChange={() => handleToolToggle(toolName)}
                        />
                        <span className="audio-settings-toggle-slider" />
                      </label>
                      <span className="audio-settings-tool-name">{toolName}</span>
                      {isConfigured && !COMMON_AUDIO_TOOLS.includes(toolName) && (
                        <button
                          className="audio-settings-remove-btn"
                          onClick={() => handleRemoveTool(toolName)}
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {toolSetting.autoPlayEnabled && (
                      <div className="audio-settings-tool-volume">
                        <span>Volume:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={toolSetting.defaultVolume}
                          onChange={(e) => handleToolVolumeChange(toolName, parseFloat(e.target.value))}
                        />
                        <span>{Math.round(toolSetting.defaultVolume * 100)}%</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add custom tool */}
            <div className="audio-settings-add-tool">
              <input
                type="text"
                placeholder="Add custom MCP tool name..."
                value={newToolName}
                onChange={(e) => setNewToolName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTool()}
              />
              <button onClick={handleAddTool} disabled={!newToolName.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioSettings
