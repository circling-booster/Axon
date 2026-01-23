/**
 * Axon Upload Manager - 모듈 진입점
 *
 * Cloudflare Tunnel을 통한 파일 공유 기능의 Electron 백엔드입니다.
 */

import { getFileServer } from './fileServer'
import { getTunnelManager } from './tunnelManager'
import { getUrlTracker } from './urlTracker'

export { registerUploadIPC, setMainWindow } from './ipc'
export { getUploadConfig, setUploadConfig } from './store'
export { getFileServer } from './fileServer'
export { getTunnelManager } from './tunnelManager'
export { getUrlTracker } from './urlTracker'
export { checkBinaryExists, downloadBinary, getBinaryPath, getVersion } from './downloadManager'

/**
 * Upload Manager Cleanup
 *
 * 앱 종료 시 호출하여 터널과 파일 서버를 정리합니다.
 */
export async function uploadCleanup(): Promise<void> {
  console.log('[Axon Upload] Cleanup starting...')

  // 터널 강제 종료
  const tunnelManager = getTunnelManager()
  await tunnelManager.forceStop()

  // 파일 서버 종료
  const fileServer = getFileServer()
  await fileServer.stop()

  // URL 트래커 정리
  const urlTracker = getUrlTracker()
  urlTracker.clear()

  console.log('[Axon Upload] Cleanup completed')
}

// 타입 re-export
export type {
  UploadConfig,
  UploadedFile,
  TunnelStatus,
  UploadState,
  UploadProviderType
} from '../../shared/types/upload'
