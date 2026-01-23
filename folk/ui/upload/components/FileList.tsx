/**
 * FileList - 업로드된 파일 목록 UI
 *
 * 업로드된 파일 목록과 각 파일의 URL을 표시합니다.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUploadManager } from '../hooks/useUploadManager'
import type { UploadedFile } from '../../../shared/types/upload'

const FileList: React.FC = () => {
  const { t } = useTranslation()
  const {
    activeFiles,
    refreshFiles,
    deleteFile,
    copyUrl,
    cleanupExpired
  } = useUploadManager()

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadedRef = useRef(false)
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      refreshFiles()
    }
  }, [refreshFiles])

  const handleCopyUrl = async (file: UploadedFile) => {
    if (file.externalUrl) {
      await copyUrl(file.externalUrl)
      setCopiedId(file.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatTimeRemaining = (expiresAt: number): string => {
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) return t('upload.file.expired', 'Expired')

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return t('upload.file.expiresIn', '{{hours}}h {{minutes}}m remaining', { hours, minutes })
    }
    return t('upload.file.expiresInMinutes', '{{minutes}}m remaining', { minutes })
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h4>{t('upload.files.title', 'Shared Files')}</h4>
        <div className="file-list-actions">
          <button
            className="refresh-btn"
            onClick={() => refreshFiles()}
            title={t('common.refresh', 'Refresh')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 104.546 2.914.5.5 0 01.908-.418A6 6 0 118 2v1z" />
              <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z" />
            </svg>
          </button>
          {activeFiles.length > 0 && (
            <button
              className="cleanup-btn"
              onClick={() => cleanupExpired()}
              title={t('upload.files.cleanup', 'Cleanup expired')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 016 5h4a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5v-5zM6 6v4h4V6H6z" />
                <path d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {activeFiles.length === 0 ? (
        <div className="file-list-empty">
          <p>{t('upload.files.empty', 'No files shared yet')}</p>
          <p className="file-list-hint">
            {t('upload.files.hint', 'Use the upload button in chat to share files')}
          </p>
        </div>
      ) : (
        <div className="file-items">
          {activeFiles.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-icon">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4.707A1 1 0 0013.707 4L10 .293A1 1 0 009.293 0H4zm5.5 1.5v2a1 1 0 001 1h2l-3-3zM3 2a1 1 0 011-1h5v3a2 2 0 002 2h2v8a1 1 0 01-1 1H4a1 1 0 01-1-1V2z" />
                </svg>
              </div>
              <div className="file-info">
                <div className="file-name">{file.originalName}</div>
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  {file.urlExpiresAt && (
                    <span className="file-expiry">{formatTimeRemaining(file.urlExpiresAt)}</span>
                  )}
                </div>
              </div>
              <div className="file-actions">
                <button
                  className="file-btn copy"
                  onClick={() => handleCopyUrl(file)}
                  title={t('common.copyUrl', 'Copy URL')}
                >
                  {copiedId === file.id ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.715 6.542L3.343 7.914a3 3 0 104.243 4.243l1.828-1.829A3 3 0 008.586 5.5L8 6.086a1.001 1.001 0 00-.154.199 2 2 0 01.861 3.337L6.88 11.45a2 2 0 11-2.83-2.83l.793-.792a4.018 4.018 0 01-.128-1.287z" />
                      <path d="M6.586 4.672A3 3 0 007.414 9.5l.775-.776a2 2 0 01-.896-3.346L9.12 3.55a2 2 0 112.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 10-4.243-4.243L6.586 4.672z" />
                    </svg>
                  )}
                </button>
                <button
                  className="file-btn delete"
                  onClick={() => handleDelete(file.id)}
                  title={t('common.delete', 'Delete')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 016 5h4a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5v-5z" />
                    <path d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileList
