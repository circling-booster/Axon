/**
 * Axon Upload Manager - 타입 정의
 *
 * Cloudflare Tunnel을 통한 파일 공유 기능의 타입 정의
 */

/** 업로드 제공자 타입 */
export type UploadProviderType = 'local' | 'cloudflare' | 's3'

/** 터널 시작 시점 */
export type TunnelStartTrigger = 'app_start' | 'on_enable' | 'on_upload'

/** 터널 종료 시점 */
export type TunnelStopTrigger = 'app_close' | 'after_minutes' | 'manual'

/** 업로드 설정 */
export interface UploadConfig {
  version: string
  enabled: boolean
  activeProvider: UploadProviderType

  cloudflare: {
    enabled: boolean
    urlExpireMinutes: number          // 기본 60분 (프롬프트 전송 시점부터)
    autoInsertUrl: boolean            // 프롬프트에 URL 자동 삽입
    tunnelStartTrigger: TunnelStartTrigger   // 터널 시작 시점
    tunnelStopTrigger: TunnelStopTrigger     // 터널 종료 시점
    tunnelStopAfterMinutes?: number          // 'after_minutes' 선택 시 분 단위
  }

  s3: {
    enabled: boolean
    bucket?: string
    region?: string
    // 자격증명은 추후 구현
  }
}

/** 업로드된 파일 정보 */
export interface UploadedFile {
  id: string                    // UUID
  originalName: string
  localPath: string             // 메모리에서 참조하는 임시 경로
  size: number
  mimeType: string
  uploadedAt: number
  externalUrl?: string          // Cloudflare URL
  urlExpiresAt?: number         // 만료 시점 (전송 시점부터 계산)
  /** URL 만료 여부 */
  isExpired?: boolean
}

/** 터널 상태 */
export type TunnelStatus = 'stopped' | 'starting' | 'running' | 'error' | 'restarting'

/** 업로드 상태 */
export interface UploadState {
  isUploading: boolean
  pendingFiles: File[]
  uploadedFiles: UploadedFile[]
  tunnelStatus: TunnelStatus
  tunnelUrl?: string
  /** 현재 사용 중인 파일 서버 포트 */
  serverPort?: number
  error?: string
  /** 터널 시작 시간 (8시간 제한 체크용) */
  tunnelStartedAt?: number
}

/** 기본 Upload 설정 */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  version: '1.0.0',
  enabled: true,
  activeProvider: 'local',
  cloudflare: {
    enabled: false,
    urlExpireMinutes: 60,
    autoInsertUrl: true,
    tunnelStartTrigger: 'on_enable',
    tunnelStopTrigger: 'app_close'
  },
  s3: {
    enabled: false
  }
}
