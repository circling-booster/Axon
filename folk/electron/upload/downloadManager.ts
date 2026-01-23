/**
 * Download Manager - cloudflared 바이너리 다운로드
 *
 * cloudflared 바이너리를 자동으로 다운로드하고 관리합니다.
 */

import fse from 'fs-extra'
import path from 'path'
import { app } from 'electron'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { createGunzip } from 'zlib'
import * as tar from 'tar'
import {
  CLOUDFLARED_VERSION,
  getCloudflaredUrl,
  getCloudflaredBinaryName
} from '../../shared/constants/cloudflared'

type ProgressCallback = (progress: number) => void

/**
 * cloudflared 바이너리 디렉토리 경로
 */
function getBinaryDir(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(process.cwd(), 'folk', 'bin', 'cloudflared')
  } else {
    return path.join(app.getPath('userData'), 'bin', 'cloudflared')
  }
}

/**
 * cloudflared 바이너리 경로
 */
export function getBinaryPath(): string {
  return path.join(getBinaryDir(), getCloudflaredBinaryName())
}

/**
 * cloudflared 바이너리 존재 확인
 */
export async function checkBinaryExists(): Promise<boolean> {
  const binaryPath = getBinaryPath()
  return fse.pathExists(binaryPath)
}

/**
 * cloudflared 바이너리 다운로드
 */
export async function downloadBinary(onProgress?: ProgressCallback): Promise<string> {
  const url = getCloudflaredUrl()
  if (!url) {
    throw new Error(`Unsupported platform: ${process.platform}-${process.arch}`)
  }

  const binaryDir = getBinaryDir()
  await fse.ensureDir(binaryDir)

  const binaryPath = getBinaryPath()

  console.log(`[Axon Upload] Downloading cloudflared ${CLOUDFLARED_VERSION} from ${url}`)

  try {
    // Node.js fetch 사용 (Electron 28+에서 기본 지원)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    let downloadedBytes = 0

    // macOS의 경우 tgz 압축 해제 필요
    if (url.endsWith('.tgz')) {
      const tempPath = path.join(binaryDir, 'cloudflared.tgz')

      // 다운로드
      const fileStream = createWriteStream(tempPath)
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('Failed to get response body reader')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        downloadedBytes += value.length
        fileStream.write(value)

        if (contentLength > 0 && onProgress) {
          onProgress(Math.round((downloadedBytes / contentLength) * 100))
        }
      }

      fileStream.close()

      // 압축 해제
      console.log('[Axon Upload] Extracting tgz archive...')
      await tar.extract({
        file: tempPath,
        cwd: binaryDir
      })

      // 임시 파일 삭제
      await fse.remove(tempPath)

      // 실행 권한 부여 (Unix)
      if (process.platform !== 'win32') {
        await fse.chmod(binaryPath, 0o755)
      }
    } else {
      // Windows/Linux: 직접 바이너리 다운로드
      const fileStream = createWriteStream(binaryPath)
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('Failed to get response body reader')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        downloadedBytes += value.length
        fileStream.write(value)

        if (contentLength > 0 && onProgress) {
          onProgress(Math.round((downloadedBytes / contentLength) * 100))
        }
      }

      fileStream.close()

      // 실행 권한 부여 (Unix)
      if (process.platform !== 'win32') {
        await fse.chmod(binaryPath, 0o755)
      }
    }

    console.log(`[Axon Upload] cloudflared downloaded to ${binaryPath}`)
    onProgress?.(100)

    return binaryPath
  } catch (error) {
    console.error('[Axon Upload] Download failed:', error)
    // 실패 시 부분 다운로드 파일 삭제
    await fse.remove(binaryPath).catch(() => {})
    throw error
  }
}

/**
 * cloudflared 버전 정보
 */
export function getVersion(): string {
  return CLOUDFLARED_VERSION
}
