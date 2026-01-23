/**
 * Upload IPC Handlers - IPC 핸들러 등록
 *
 * Renderer Process와의 통신을 위한 IPC 핸들러를 등록합니다.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getUploadConfig, setUploadConfig } from './store'
import { getFileServer } from './fileServer'
import { getTunnelManager } from './tunnelManager'
import { getUrlTracker } from './urlTracker'
import { checkBinaryExists, downloadBinary, getBinaryPath } from './downloadManager'
import type { UploadConfig, UploadedFile, TunnelStatus } from '../../shared/types/upload'

// 모듈 내부에서 사용할 윈도우 참조
let mainWindow: BrowserWindow | null = null

/**
 * BrowserWindow 설정
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
  getTunnelManager().setMainWindow(win)
}

/**
 * Upload IPC 핸들러 등록
 */
export function registerUploadIPC(): void {
  // 설정 조회
  ipcMain.handle('axon:upload:getConfig', async (): Promise<UploadConfig> => {
    return getUploadConfig()
  })

  // 설정 저장
  ipcMain.handle('axon:upload:setConfig', async (_event, config: UploadConfig): Promise<void> => {
    await setUploadConfig(config)
  })

  // 터널 시작
  ipcMain.handle('axon:upload:startTunnel', async (): Promise<{ url: string; port: number }> => {
    const tunnelManager = getTunnelManager()
    const result = await tunnelManager.start()

    // URL 트래커 시작
    const urlTracker = getUrlTracker()
    urlTracker.startCleanupInterval()

    return result
  })

  // 터널 중지
  ipcMain.handle('axon:upload:stopTunnel', async (): Promise<void> => {
    const tunnelManager = getTunnelManager()
    await tunnelManager.stop()

    // 파일 서버도 중지
    const fileServer = getFileServer()
    await fileServer.stop()

    // URL 트래커 정리
    const urlTracker = getUrlTracker()
    urlTracker.clear()
  })

  // 터널 상태 조회
  ipcMain.handle('axon:upload:getTunnelStatus', async (): Promise<{ status: TunnelStatus; url?: string; port?: number }> => {
    const tunnelManager = getTunnelManager()
    const { status, url, startedAt } = tunnelManager.getStatus()

    const fileServer = getFileServer()
    const port = fileServer.isRunning() ? fileServer.getPort() : undefined

    return { status, url, port }
  })

  // 파일 등록
  ipcMain.handle('axon:upload:registerFile', async (
    _event,
    file: { name: string; path: string; size: number; mimeType: string }
  ): Promise<UploadedFile> => {
    const id = uuidv4()

    // 파일 서버에 등록
    const fileServer = getFileServer()
    fileServer.registerFile(id, file.path, file.name, file.mimeType)

    // 터널 URL 가져오기
    const tunnelManager = getTunnelManager()
    const { url: tunnelUrl } = tunnelManager.getStatus()

    const externalUrl = tunnelUrl ? `${tunnelUrl}/files/${id}` : undefined

    const uploadedFile: UploadedFile = {
      id,
      originalName: file.name,
      localPath: file.path,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: Date.now(),
      externalUrl
    }

    // URL 트래커에 등록
    const urlTracker = getUrlTracker()
    urlTracker.trackFile(uploadedFile)

    return uploadedFile
  })

  // 파일 등록 해제
  ipcMain.handle('axon:upload:unregisterFile', async (_event, fileId: string): Promise<void> => {
    const urlTracker = getUrlTracker()
    urlTracker.untrackFile(fileId)
  })

  // 전송 완료 표시 (만료 시간 설정)
  ipcMain.handle('axon:upload:markAsSent', async (_event, fileIds: string[]): Promise<void> => {
    const config = await getUploadConfig()
    const expireMinutes = config.cloudflare.urlExpireMinutes

    const urlTracker = getUrlTracker()
    for (const id of fileIds) {
      urlTracker.markAsSent(id, expireMinutes)
    }
  })

  // 파일 목록 조회
  ipcMain.handle('axon:upload:getFiles', async (): Promise<UploadedFile[]> => {
    const urlTracker = getUrlTracker()
    return urlTracker.getTrackedFiles()
  })

  // 만료된 파일 정리
  ipcMain.handle('axon:upload:cleanupExpired', async (): Promise<number> => {
    const urlTracker = getUrlTracker()
    return urlTracker.cleanupExpired()
  })

  // cloudflared 바이너리 존재 확인
  ipcMain.handle('axon:upload:checkBinary', async (): Promise<boolean> => {
    return checkBinaryExists()
  })

  // cloudflared 바이너리 다운로드
  ipcMain.handle('axon:upload:downloadBinary', async (): Promise<void> => {
    await downloadBinary((progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('axon:upload:downloadProgress', progress)
      }
    })
  })

  console.log('[Axon Upload] IPC handlers registered')
}
