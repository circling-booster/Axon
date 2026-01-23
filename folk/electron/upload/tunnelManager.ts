/**
 * Tunnel Manager - cloudflared 프로세스 관리
 *
 * Cloudflare Quick Tunnel을 통해 로컬 서버를 외부에 노출합니다.
 */

import { spawn, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import { getBinaryPath, checkBinaryExists, downloadBinary } from './downloadManager'
import { getFileServer } from './fileServer'
import { MAX_TUNNEL_DURATION_MS, TUNNEL_RESTART_BUFFER_MS } from '../../shared/constants/cloudflared'
import type { TunnelStatus } from '../../shared/types/upload'

type StatusChangeCallback = (status: TunnelStatus, url?: string) => void

export class TunnelManager {
  private process: ChildProcess | null = null
  private startTime: number = 0
  private restartTimer: NodeJS.Timeout | null = null
  private tunnelUrl: string | null = null
  private status: TunnelStatus = 'stopped'
  private mainWindow: BrowserWindow | null = null
  private onStatusChange: StatusChangeCallback | null = null

  /**
   * BrowserWindow 설정
   */
  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  /**
   * 상태 변경 콜백 설정
   */
  setOnStatusChange(callback: StatusChangeCallback): void {
    this.onStatusChange = callback
  }

  /**
   * 현재 상태 가져오기
   */
  getStatus(): { status: TunnelStatus; url?: string; startedAt?: number } {
    return {
      status: this.status,
      url: this.tunnelUrl || undefined,
      startedAt: this.startTime || undefined
    }
  }

  /**
   * 터널 시작
   */
  async start(): Promise<{ url: string; port: number }> {
    if (this.process) {
      if (this.tunnelUrl) {
        const fileServer = getFileServer()
        return { url: this.tunnelUrl, port: fileServer.getPort() }
      }
      throw new Error('Tunnel is already starting')
    }

    this.updateStatus('starting')

    // cloudflared 바이너리 확인
    const binaryExists = await checkBinaryExists()
    if (!binaryExists) {
      console.log('[Axon Upload] cloudflared not found, downloading...')
      await downloadBinary((progress) => {
        this.notifyDownloadProgress(progress)
      })
    }

    // 파일 서버 시작
    const fileServer = getFileServer()
    const port = await fileServer.start()

    // 터널 시작
    const binaryPath = getBinaryPath()
    const tunnelUrl = await this.spawnTunnel(binaryPath, port)

    this.startTime = Date.now()
    this.tunnelUrl = tunnelUrl
    this.updateStatus('running', tunnelUrl)

    // 8시간 제한 대응: 7시간 50분 후 재시작 예약
    this.scheduleRestart()

    return { url: tunnelUrl, port }
  }

  /**
   * cloudflared 프로세스 실행
   */
  private spawnTunnel(binaryPath: string, port: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['tunnel', '--url', `http://127.0.0.1:${port}`]

      console.log(`[Axon Upload] Spawning: ${binaryPath} ${args.join(' ')}`)

      this.process = spawn(binaryPath, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      })

      let urlFound = false
      const urlTimeout = setTimeout(() => {
        if (!urlFound) {
          reject(new Error('Timeout waiting for tunnel URL'))
          this.stop()
        }
      }, 30000)

      // URL 파싱 (stderr에서 출력됨)
      this.process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString()
        console.log('[cloudflared]', output.trim())

        // Quick Tunnel URL 파싱
        // 형식: "... https://xxx.trycloudflare.com ..."
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
        if (urlMatch && !urlFound) {
          urlFound = true
          clearTimeout(urlTimeout)
          resolve(urlMatch[0])
        }
      })

      this.process.stdout?.on('data', (data: Buffer) => {
        console.log('[cloudflared stdout]', data.toString().trim())
      })

      this.process.on('error', (error) => {
        console.error('[Axon Upload] cloudflared error:', error)
        clearTimeout(urlTimeout)
        this.updateStatus('error')
        reject(error)
      })

      this.process.on('close', (code) => {
        console.log(`[Axon Upload] cloudflared exited with code ${code}`)
        this.process = null
        this.tunnelUrl = null

        if (this.status !== 'restarting') {
          this.updateStatus('stopped')
        }
      })
    })
  }

  /**
   * 재시작 예약
   */
  private scheduleRestart(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
    }

    const restartIn = MAX_TUNNEL_DURATION_MS - TUNNEL_RESTART_BUFFER_MS

    this.restartTimer = setTimeout(async () => {
      console.log('[Axon Upload] Scheduled restart triggered')
      await this.restart()
    }, restartIn)

    console.log(`[Axon Upload] Restart scheduled in ${Math.round(restartIn / 1000 / 60)} minutes`)
  }

  /**
   * 터널 재시작
   */
  async restart(): Promise<string> {
    console.log('[Axon Upload] Restarting tunnel...')
    this.updateStatus('restarting')

    // 기존 터널 종료
    await this.stop()

    // 새 터널 시작
    const { url } = await this.start()

    // 재시작 알림
    this.notifyTunnelRestarted(url)

    return url
  }

  /**
   * 터널 중지
   */
  async stop(): Promise<void> {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }

    if (this.process) {
      console.log('[Axon Upload] Stopping tunnel...')
      const currentProcess = this.process

      return new Promise((resolve) => {
        const killTimeout = setTimeout(() => {
          if (!currentProcess.killed) {
            currentProcess.kill('SIGKILL')
          }
          resolve()
        }, 5000)

        currentProcess.once('close', () => {
          clearTimeout(killTimeout)
          resolve()
        })

        currentProcess.kill('SIGTERM')
      })
    }

    this.tunnelUrl = null
    this.updateStatus('stopped')
  }

  /**
   * 강제 종료 (cleanup용)
   */
  async forceStop(): Promise<void> {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }

    if (this.process && !this.process.killed) {
      this.process.kill('SIGKILL')
      this.process = null
    }

    this.tunnelUrl = null
    this.status = 'stopped'
  }

  /**
   * 상태 업데이트
   */
  private updateStatus(status: TunnelStatus, url?: string): void {
    this.status = status
    this.onStatusChange?.(status, url)
  }

  /**
   * 다운로드 진행률 알림
   */
  private notifyDownloadProgress(progress: number): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('axon:upload:downloadProgress', progress)
    }
  }

  /**
   * 터널 재시작 알림
   */
  private notifyTunnelRestarted(newUrl: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('axon:upload:tunnelRestarted', newUrl)
    }
  }
}

// 싱글톤 인스턴스
let instance: TunnelManager | null = null

export function getTunnelManager(): TunnelManager {
  if (!instance) {
    instance = new TunnelManager()
  }
  return instance
}
