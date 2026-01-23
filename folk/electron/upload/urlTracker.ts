/**
 * URL Tracker - URL 만료 관리
 *
 * 업로드된 파일의 URL 만료 시간을 추적하고 관리합니다.
 */

import { getFileServer } from './fileServer'
import type { UploadedFile } from '../../shared/types/upload'
import { DEFAULT_URL_EXPIRE_MINUTES } from '../../shared/constants/cloudflared'

interface TrackedFile {
  file: UploadedFile
  timer?: NodeJS.Timeout
}

class UrlTracker {
  private trackedFiles: Map<string, TrackedFile> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  /**
   * 정기 정리 시작
   */
  startCleanupInterval(): void {
    if (this.cleanupInterval) return

    // 1분마다 만료 파일 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired()
    }, 60 * 1000)

    console.log('[Axon Upload] URL cleanup interval started')
  }

  /**
   * 정기 정리 중지
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * 파일 추적 등록
   */
  trackFile(file: UploadedFile): void {
    this.trackedFiles.set(file.id, { file })
    console.log(`[Axon Upload] Tracking file: ${file.id}`)
  }

  /**
   * 전송 완료 표시 및 만료 시간 설정
   */
  markAsSent(fileId: string, expireMinutes: number = DEFAULT_URL_EXPIRE_MINUTES): void {
    const tracked = this.trackedFiles.get(fileId)
    if (!tracked) return

    const expiresAt = Date.now() + expireMinutes * 60 * 1000
    tracked.file.urlExpiresAt = expiresAt
    tracked.file.isExpired = false

    // 파일 서버에도 만료 시간 설정
    const fileServer = getFileServer()
    fileServer.markAsSent(fileId, expireMinutes)

    // 만료 타이머 설정
    if (tracked.timer) {
      clearTimeout(tracked.timer)
    }

    tracked.timer = setTimeout(() => {
      this.expireFile(fileId)
    }, expireMinutes * 60 * 1000)

    console.log(`[Axon Upload] File ${fileId} marked as sent, expires in ${expireMinutes} minutes`)
  }

  /**
   * 파일 만료 처리
   */
  private expireFile(fileId: string): void {
    const tracked = this.trackedFiles.get(fileId)
    if (!tracked) return

    tracked.file.isExpired = true

    // 파일 서버에서 제거
    const fileServer = getFileServer()
    fileServer.unregisterFile(fileId)

    // 타이머 정리
    if (tracked.timer) {
      clearTimeout(tracked.timer)
    }

    this.trackedFiles.delete(fileId)
    console.log(`[Axon Upload] File ${fileId} expired and removed`)
  }

  /**
   * 만료된 파일 정리
   */
  cleanupExpired(): number {
    const now = Date.now()
    let count = 0

    for (const [id, tracked] of this.trackedFiles.entries()) {
      if (tracked.file.urlExpiresAt && now > tracked.file.urlExpiresAt) {
        this.expireFile(id)
        count++
      }
    }

    // 파일 서버도 정리
    const fileServer = getFileServer()
    count += fileServer.cleanupExpired()

    return count
  }

  /**
   * 추적 해제
   */
  untrackFile(fileId: string): void {
    const tracked = this.trackedFiles.get(fileId)
    if (tracked?.timer) {
      clearTimeout(tracked.timer)
    }
    this.trackedFiles.delete(fileId)

    // 파일 서버에서도 제거
    const fileServer = getFileServer()
    fileServer.unregisterFile(fileId)

    console.log(`[Axon Upload] File ${fileId} untracked`)
  }

  /**
   * 모든 추적 파일 가져오기
   */
  getTrackedFiles(): UploadedFile[] {
    return Array.from(this.trackedFiles.values()).map(t => t.file)
  }

  /**
   * 특정 파일 정보 가져오기
   */
  getFile(fileId: string): UploadedFile | null {
    return this.trackedFiles.get(fileId)?.file || null
  }

  /**
   * 모든 추적 정리
   */
  clear(): void {
    for (const tracked of this.trackedFiles.values()) {
      if (tracked.timer) {
        clearTimeout(tracked.timer)
      }
    }
    this.trackedFiles.clear()
    this.stopCleanupInterval()
  }
}

// 싱글톤 인스턴스
let instance: UrlTracker | null = null

export function getUrlTracker(): UrlTracker {
  if (!instance) {
    instance = new UrlTracker()
  }
  return instance
}
