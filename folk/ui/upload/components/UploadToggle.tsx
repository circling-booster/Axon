/**
 * UploadToggle - ChatInput용 업로드 토글 버튼
 *
 * ChatInput에 삽입되어 파일 업로드 기능을 제공합니다.
 */

import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUploadManager } from '../hooks/useUploadManager'

interface UploadToggleProps {
  onUrlInsert: (url: string, fileName: string) => void
  disabled?: boolean
}

const UploadToggle: React.FC<UploadToggleProps> = ({ onUrlInsert, disabled }) => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    config,
    isTunnelRunning,
    tunnelStatus,
    uploadFile,
    startTunnel
  } = useUploadManager()

  const [isUploading, setIsUploading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const isEnabled = config.cloudflare.enabled

  const handleClick = async () => {
    if (!isEnabled) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 3000)
      return
    }

    if (!isTunnelRunning) {
      // 터널이 실행 중이 아니면 자동으로 시작
      try {
        await startTunnel()
      } catch (error) {
        console.error('Failed to start tunnel:', error)
        return
      }
    }

    // 파일 선택 다이얼로그 열기
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // Electron을 통해 파일 경로 가져오기
      // Electron 24+에서는 webUtils.getPathForFile 사용, 이전 버전은 file.path
      let filePath: string
      if ((window as any).webUtils?.getPathForFile) {
        filePath = (window as any).webUtils.getPathForFile(file)
      } else {
        filePath = (file as any).path || ''
      }

      if (!filePath) {
        throw new Error('Could not get file path')
      }

      // 파일 정보를 객체로 전달 (mimeType 포함)
      const uploadedFile = await uploadFile({
        name: file.name,
        path: filePath,
        size: file.size,
        mimeType: file.type || 'application/octet-stream'
      })
      if (uploadedFile.externalUrl) {
        onUrlInsert(uploadedFile.externalUrl, uploadedFile.originalName)
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert(t('upload.error.uploadFailed', 'Failed to upload file'))
    } finally {
      setIsUploading(false)
      // 같은 파일 재선택을 위해 value 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!isEnabled) {
    return (
      <div className="upload-toggle-container">
        <button
          className="upload-toggle-btn disabled"
          onClick={handleClick}
          disabled={disabled}
          title={t('upload.disabled', 'Upload is disabled. Enable it in settings.')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
        </button>
        {showTooltip && (
          <div className="upload-tooltip">
            {t('upload.enableInSettings', 'Enable Upload Manager in Settings')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="upload-toggle-container">
      <button
        className={`upload-toggle-btn ${isTunnelRunning ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
        onClick={handleClick}
        disabled={disabled || isUploading}
        title={isTunnelRunning
          ? t('upload.uploadFile', 'Upload file')
          : t('upload.startAndUpload', 'Start tunnel and upload file')
        }
      >
        {isUploading ? (
          <svg className="spinning" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a7 7 0 100 14 7 7 0 000-14zm-8 7a8 8 0 1116 0 8 8 0 01-16 0z" opacity="0.25" />
            <path d="M10 3a7 7 0 017 7h1a8 8 0 00-8-8v1z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {isTunnelRunning && tunnelStatus.url && (
        <div className="tunnel-indicator" title={tunnelStatus.url}>
          <span className="tunnel-dot"></span>
        </div>
      )}
    </div>
  )
}

export default UploadToggle
