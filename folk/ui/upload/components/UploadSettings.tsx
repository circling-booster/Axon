/**
 * UploadSettings - Upload Manager 설정 UI
 *
 * Upload Manager의 메인 설정 화면입니다.
 */

import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUploadManager } from '../hooks/useUploadManager'
import TunnelControl from './TunnelControl'
import FileList from './FileList'
import DownloadProgress from './DownloadProgress'

const UploadSettings: React.FC = () => {
  const { t } = useTranslation()
  const {
    config,
    isLoading,
    downloadProgress,
    isTunnelRunning,
    loadConfig,
    saveConfig
  } = useUploadManager()

  const loadedRef = useRef(false)
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadConfig()
    }
  }, [loadConfig])

  if (isLoading) {
    return (
      <div className="upload-loading">
        {t('upload.loading', 'Loading upload settings...')}
      </div>
    )
  }

  const handleCloudflareToggle = (enabled: boolean) => {
    saveConfig({
      cloudflare: { ...config.cloudflare, enabled }
    })
  }

  const handleUrlExpireChange = (minutes: number) => {
    saveConfig({
      cloudflare: { ...config.cloudflare, urlExpireMinutes: minutes }
    })
  }

  const handleAutoInsertToggle = (autoInsertUrl: boolean) => {
    saveConfig({
      cloudflare: { ...config.cloudflare, autoInsertUrl }
    })
  }

  return (
    <div className="upload-settings">
      {/* Header */}
      <div className="upload-header">
        <div className="upload-title">
          <h3>{t('upload.title', 'Upload Manager')}</h3>
          <p className="upload-description">
            {t('upload.description', 'Share files via Cloudflare Quick Tunnel')}
          </p>
        </div>

        {/* Master Toggle */}
        <label className="upload-toggle">
          <input
            type="checkbox"
            checked={config.cloudflare.enabled}
            onChange={(e) => handleCloudflareToggle(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {config.cloudflare.enabled && (
        <>
          {/* Download Progress (cloudflared binary) */}
          {downloadProgress !== null && (
            <DownloadProgress progress={downloadProgress} />
          )}

          {/* Options */}
          <div className="upload-options">
            <div className="upload-option">
              <label>
                <input
                  type="checkbox"
                  checked={config.cloudflare.autoInsertUrl}
                  onChange={(e) => handleAutoInsertToggle(e.target.checked)}
                />
                {t('upload.autoInsertUrl', 'Auto-insert URL to chat')}
              </label>
            </div>

            <div className="upload-option">
              <label>{t('upload.urlExpireMinutes', 'URL expiration (minutes)')}</label>
              <input
                type="number"
                value={config.cloudflare.urlExpireMinutes}
                onChange={(e) => handleUrlExpireChange(parseInt(e.target.value, 10) || 60)}
                min={1}
                max={480}
              />
            </div>
          </div>

          {/* Tunnel Control */}
          <TunnelControl />

          {/* File List */}
          {isTunnelRunning && <FileList />}
        </>
      )}
    </div>
  )
}

export default UploadSettings
