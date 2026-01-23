/**
 * TunnelControl - 터널 제어 UI
 *
 * Cloudflare 터널의 시작/중지 및 상태를 표시합니다.
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUploadManager } from '../hooks/useUploadManager'

const TunnelControl: React.FC = () => {
  const { t } = useTranslation()
  const {
    tunnelStatus,
    isTunnelRunning,
    startTunnel,
    stopTunnel,
    copyUrl
  } = useUploadManager()

  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await startTunnel()
    } catch (error) {
      console.error('Failed to start tunnel:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleStop = async () => {
    setIsStopping(true)
    try {
      await stopTunnel()
    } catch (error) {
      console.error('Failed to stop tunnel:', error)
    } finally {
      setIsStopping(false)
    }
  }

  const handleCopyUrl = async () => {
    if (tunnelStatus.url) {
      await copyUrl(tunnelStatus.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusLabel = () => {
    switch (tunnelStatus.status) {
      case 'running':
        return t('upload.tunnel.running', 'Running')
      case 'starting':
        return t('upload.tunnel.starting', 'Starting...')
      case 'restarting':
        return t('upload.tunnel.restarting', 'Restarting...')
      case 'stopping':
        return t('upload.tunnel.stopping', 'Stopping...')
      case 'error':
        return t('upload.tunnel.error', 'Error')
      default:
        return t('upload.tunnel.stopped', 'Stopped')
    }
  }

  const getUptime = () => {
    if (!tunnelStatus.startedAt) return null
    const seconds = Math.floor((Date.now() - tunnelStatus.startedAt) / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="tunnel-control">
      <div className="tunnel-header">
        <h4>{t('upload.tunnel.title', 'Tunnel')}</h4>
        <div className={`tunnel-status-badge ${tunnelStatus.status}`}>
          {getStatusLabel()}
        </div>
      </div>

      {/* Tunnel URL */}
      {tunnelStatus.url && (
        <div className="tunnel-url-container">
          <div className="tunnel-url">
            <span className="url-text">{tunnelStatus.url}</span>
            <button
              className="copy-btn"
              onClick={handleCopyUrl}
              title={t('common.copy', 'Copy')}
            >
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" />
                  <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" />
                </svg>
              )}
            </button>
          </div>
          {tunnelStatus.startedAt && (
            <div className="tunnel-uptime">
              {t('upload.tunnel.uptime', 'Uptime')}: {getUptime()}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="tunnel-actions">
        {!isTunnelRunning ? (
          <button
            className="tunnel-btn start"
            onClick={handleStart}
            disabled={isStarting || tunnelStatus.status === 'starting'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.271 3.055a.5.5 0 01.52.038l6 4a.5.5 0 010 .814l-6 4A.5.5 0 016 11.5v-8a.5.5 0 01.271-.445z" />
            </svg>
            {isStarting
              ? t('upload.tunnel.starting', 'Starting...')
              : t('upload.tunnel.start', 'Start Tunnel')}
          </button>
        ) : (
          <button
            className="tunnel-btn stop"
            onClick={handleStop}
            disabled={isStopping || tunnelStatus.status === 'restarting'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 016 5h4a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5v-4z" />
            </svg>
            {isStopping
              ? t('upload.tunnel.stopping', 'Stopping...')
              : t('upload.tunnel.stop', 'Stop Tunnel')}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="tunnel-info">
        <p>
          {t('upload.tunnel.info', 'Files are shared via trycloudflare.com. The tunnel URL changes on restart.')}
        </p>
        <p className="tunnel-warning">
          {t('upload.tunnel.warning', 'Note: Quick Tunnels have an 8-hour limit. The tunnel will auto-restart before expiration.')}
        </p>
      </div>
    </div>
  )
}

export default TunnelControl
