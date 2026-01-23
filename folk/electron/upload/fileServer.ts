/**
 * File Server - Express 로컬 파일 서버
 *
 * 동적 포트 할당으로 로컬 파일을 서빙하는 Express 서버입니다.
 */

import express, { Application, Request, Response } from 'express'
import { Server } from 'http'
import { AddressInfo } from 'net'
import path from 'path'

interface FileEntry {
  path: string
  name: string
  mimeType: string
  expiresAt?: number
}

export class FileServer {
  private app: Application | null = null
  private server: Server | null = null
  private files: Map<string, FileEntry> = new Map()
  private port: number = 0

  /**
   * 서버 시작
   * @returns 할당된 포트 번호
   */
  async start(): Promise<number> {
    if (this.server) {
      return this.port
    }

    this.app = express()

    // 파일 서빙 엔드포인트
    this.app.get('/files/:id', (req: Request, res: Response) => {
      const fileId = req.params.id as string
      const file = this.files.get(fileId)

      if (!file) {
        res.status(404).send('File not found')
        return
      }

      // 만료 체크
      if (file.expiresAt && Date.now() > file.expiresAt) {
        this.files.delete(fileId)
        res.status(410).send('File expired')
        return
      }

      res.setHeader('Content-Type', file.mimeType)
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`)
      res.sendFile(path.resolve(file.path))
    })

    // 헬스 체크
    this.app.get('/health', (_req: Request, res: Response) => {
      res.send('OK')
    })

    // 동적 포트 할당 (포트 0)
    return new Promise((resolve, reject) => {
      this.server = this.app!.listen(0, '127.0.0.1', () => {
        this.port = (this.server!.address() as AddressInfo).port
        console.log(`[Axon Upload] File server started on port ${this.port}`)
        resolve(this.port)
      })

      this.server.on('error', (error) => {
        console.error('[Axon Upload] File server error:', error)
        reject(error)
      })
    })
  }

  /**
   * 현재 포트 가져오기
   */
  getPort(): number {
    return this.port
  }

  /**
   * 서버가 실행 중인지 확인
   */
  isRunning(): boolean {
    return this.server !== null
  }

  /**
   * 파일 등록
   */
  registerFile(id: string, filePath: string, name: string, mimeType: string): void {
    this.files.set(id, { path: filePath, name, mimeType })
    console.log(`[Axon Upload] File registered: ${id} -> ${name}`)
  }

  /**
   * 전송 시점에 만료 시간 설정
   */
  markAsSent(id: string, expireMinutes: number): void {
    const file = this.files.get(id)
    if (file) {
      file.expiresAt = Date.now() + expireMinutes * 60 * 1000
      console.log(`[Axon Upload] File ${id} marked as sent, expires in ${expireMinutes} minutes`)
    }
  }

  /**
   * 파일 등록 해제
   */
  unregisterFile(id: string): void {
    this.files.delete(id)
    console.log(`[Axon Upload] File unregistered: ${id}`)
  }

  /**
   * 만료된 파일 정리
   */
  cleanupExpired(): number {
    const now = Date.now()
    let count = 0

    for (const [id, file] of this.files.entries()) {
      if (file.expiresAt && now > file.expiresAt) {
        this.files.delete(id)
        count++
      }
    }

    if (count > 0) {
      console.log(`[Axon Upload] Cleaned up ${count} expired file(s)`)
    }

    return count
  }

  /**
   * 서버 중지
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null
          this.app = null
          this.files.clear()
          this.port = 0
          console.log('[Axon Upload] File server stopped')
          resolve()
        })
      })
    }
  }

  /**
   * 등록된 파일 수
   */
  getFileCount(): number {
    return this.files.size
  }
}

// 싱글톤 인스턴스
let instance: FileServer | null = null

export function getFileServer(): FileServer {
  if (!instance) {
    instance = new FileServer()
  }
  return instance
}
