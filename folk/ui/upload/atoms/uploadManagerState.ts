/**
 * Upload Manager State - Jotai Atoms
 *
 * Upload Manager의 상태 관리를 위한 Jotai atoms입니다.
 */

import { atom } from 'jotai'
import type { UploadConfig, UploadedFile, TunnelStatus, DEFAULT_UPLOAD_CONFIG } from '../../../shared/types/upload'

// === State Atoms ===

/**
 * Upload 설정 atom
 */
export const uploadConfigAtom = atom<UploadConfig>({
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
})

/**
 * 설정 로딩 상태
 */
export const isLoadingConfigAtom = atom<boolean>(true)

/**
 * 터널 상태 atom
 */
export const tunnelStatusAtom = atom<{
  status: TunnelStatus
  url?: string
  startedAt?: number
}>({
  status: 'stopped'
})

/**
 * 업로드된 파일 목록 atom
 */
export const uploadedFilesAtom = atom<UploadedFile[]>([])

/**
 * 다운로드 진행률 atom (cloudflared 바이너리)
 */
export const downloadProgressAtom = atom<number | null>(null)

// === Derived Atoms ===

/**
 * 터널 실행 중 여부
 */
export const isTunnelRunningAtom = atom((get) => {
  const { status } = get(tunnelStatusAtom)
  return status === 'running' || status === 'starting' || status === 'restarting'
})

/**
 * 활성 파일 (만료되지 않은 파일) 목록
 */
export const activeFilesAtom = atom((get) => {
  const files = get(uploadedFilesAtom)
  const now = Date.now()
  return files.filter(f => !f.urlExpiresAt || f.urlExpiresAt > now)
})

// === Action Atoms ===

/**
 * 설정 로드
 */
export const loadConfigAtom = atom(null, async (get, set) => {
  set(isLoadingConfigAtom, true)
  try {
    const config = await window.ipcRenderer.invoke('axon:upload:getConfig')
    set(uploadConfigAtom, config)
  } catch (error) {
    console.error('Failed to load upload config:', error)
  } finally {
    set(isLoadingConfigAtom, false)
  }
})

/**
 * 설정 저장
 */
export const saveConfigAtom = atom(null, async (get, set, config: Partial<UploadConfig>) => {
  const current = get(uploadConfigAtom)
  const newConfig = { ...current, ...config }

  try {
    await window.ipcRenderer.invoke('axon:upload:setConfig', newConfig)
    set(uploadConfigAtom, newConfig)
  } catch (error) {
    console.error('Failed to save upload config:', error)
    throw error
  }
})

/**
 * 터널 시작
 */
export const startTunnelAtom = atom(null, async (get, set) => {
  try {
    set(tunnelStatusAtom, { status: 'starting' })
    const result = await window.ipcRenderer.invoke('axon:upload:startTunnel')
    set(tunnelStatusAtom, {
      status: 'running',
      url: result.url,
      startedAt: Date.now()
    })
    return result
  } catch (error) {
    set(tunnelStatusAtom, { status: 'error' })
    console.error('Failed to start tunnel:', error)
    throw error
  }
})

/**
 * 터널 중지
 */
export const stopTunnelAtom = atom(null, async (get, set) => {
  try {
    await window.ipcRenderer.invoke('axon:upload:stopTunnel')
    set(tunnelStatusAtom, { status: 'stopped' })
    set(uploadedFilesAtom, []) // 터널 중지 시 파일 목록 초기화
  } catch (error) {
    console.error('Failed to stop tunnel:', error)
    throw error
  }
})

/**
 * 터널 상태 조회
 */
export const getTunnelStatusAtom = atom(null, async (get, set) => {
  try {
    const status = await window.ipcRenderer.invoke('axon:upload:getTunnelStatus')
    set(tunnelStatusAtom, status)
    return status
  } catch (error) {
    console.error('Failed to get tunnel status:', error)
    throw error
  }
})

/**
 * 파일 업로드 (로컬 서버에 등록)
 */
export const uploadFileAtom = atom(null, async (get, set, file: { name: string; path: string; size: number; mimeType: string }) => {
  try {
    const result = await window.ipcRenderer.invoke('axon:upload:registerFile', file)

    // 업로드된 파일 목록에 추가
    set(uploadedFilesAtom, (prev) => [...prev, result])

    return result
  } catch (error) {
    console.error('Failed to upload file:', error)
    throw error
  }
})

/**
 * 파일 삭제
 */
export const deleteFileAtom = atom(null, async (get, set, fileId: string) => {
  try {
    await window.ipcRenderer.invoke('axon:upload:unregisterFile', fileId)
    set(uploadedFilesAtom, (prev) => prev.filter(f => f.id !== fileId))
  } catch (error) {
    console.error('Failed to delete file:', error)
    throw error
  }
})

/**
 * 파일 목록 갱신
 */
export const refreshFilesAtom = atom(null, async (get, set) => {
  try {
    const files = await window.ipcRenderer.invoke('axon:upload:getFiles')
    set(uploadedFilesAtom, files)
    return files
  } catch (error) {
    console.error('Failed to refresh files:', error)
    throw error
  }
})

/**
 * 만료된 파일 정리
 */
export const cleanupExpiredAtom = atom(null, async (get, set) => {
  try {
    const removedCount = await window.ipcRenderer.invoke('axon:upload:cleanupExpired')
    // 파일 목록 갱신
    await set(refreshFilesAtom)
    return removedCount
  } catch (error) {
    console.error('Failed to cleanup expired files:', error)
    throw error
  }
})

/**
 * 다운로드 진행률 업데이트
 */
export const updateDownloadProgressAtom = atom(null, (get, set, progress: number | null) => {
  set(downloadProgressAtom, progress)
})

/**
 * 터널 재시작 알림 처리
 */
export const handleTunnelRestartedAtom = atom(null, (get, set, newUrl: string) => {
  set(tunnelStatusAtom, {
    status: 'running',
    url: newUrl,
    startedAt: Date.now()
  })
})
