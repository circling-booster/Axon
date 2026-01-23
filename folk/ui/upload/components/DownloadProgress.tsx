/**
 * DownloadProgress - cloudflared 다운로드 진행률 UI
 *
 * cloudflared 바이너리 다운로드 진행 상태를 표시합니다.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'

interface DownloadProgressProps {
  progress: number
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ progress }) => {
  const { t } = useTranslation()

  return (
    <div className="download-progress">
      <div className="download-info">
        <span className="download-label">
          {t('upload.download.label', 'Downloading cloudflared...')}
        </span>
        <span className="download-percent">{Math.round(progress)}%</span>
      </div>
      <div className="download-bar">
        <div
          className="download-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default DownloadProgress
