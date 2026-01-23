/**
 * Cloudflare Provider
 *
 * Cloudflare Quick Tunnel을 사용한 파일 공유 Provider입니다.
 * 실제 터널 관리는 Electron main process에서 수행됩니다.
 */

import type { UploadProvider } from './index'
import type { UploadedFile, TunnelStatus } from '../../../shared/types/upload'

export class CloudflareProvider implements UploadProvider {
  readonly name = 'Cloudflare Quick Tunnel'
  readonly description = 'Share files via Cloudflare Quick Tunnel (trycloudflare.com)'
  readonly requiresSetup = false

  async initialize(): Promise<void> {
    // cloudflared 바이너리 확인은 start() 시 자동으로 수행됨
  }

  async start(): Promise<{ url: string }> {
    const result = await window.ipcRenderer.invoke('axon:upload:startTunnel')
    return { url: result.url }
  }

  async stop(): Promise<void> {
    await window.ipcRenderer.invoke('axon:upload:stopTunnel')
  }

  async getStatus(): Promise<{ status: TunnelStatus; url?: string }> {
    return await window.ipcRenderer.invoke('axon:upload:getTunnelStatus')
  }

  async uploadFile(filePath: string, expirationHours?: number): Promise<UploadedFile> {
    return await window.ipcRenderer.invoke('axon:upload:uploadFile', filePath, expirationHours)
  }

  async deleteFile(fileId: string): Promise<void> {
    await window.ipcRenderer.invoke('axon:upload:deleteFile', fileId)
  }

  async getFiles(): Promise<UploadedFile[]> {
    return await window.ipcRenderer.invoke('axon:upload:getFiles')
  }

  async cleanup(): Promise<void> {
    await window.ipcRenderer.invoke('axon:upload:cleanupExpired')
  }
}
