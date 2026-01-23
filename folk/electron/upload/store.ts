/**
 * Upload Store - 설정 파일 관리
 *
 * axon_upload.json 파일을 통해 Upload Manager 설정을 저장/로드합니다.
 */

import fse from 'fs-extra'
import path from 'path'
import { app } from 'electron'
import type { UploadConfig } from '../../shared/types/upload'
import { DEFAULT_UPLOAD_CONFIG } from '../../shared/types/upload'

const CONFIG_FILENAME = 'axon_upload.json'

/**
 * 설정 디렉토리 경로 가져오기
 */
function getConfigDir(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(process.cwd(), '.config')
  } else {
    return path.join(app.getPath('home'), '.dive', 'config')
  }
}

/**
 * 설정 파일 경로 가져오기
 */
function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILENAME)
}

/**
 * 설정 로드
 */
export async function getUploadConfig(): Promise<UploadConfig> {
  const configPath = getConfigPath()

  try {
    if (await fse.pathExists(configPath)) {
      const config = await fse.readJSON(configPath)
      // 마이그레이션 적용
      return applyMigrations(config)
    }
  } catch (error) {
    console.error('[Axon Upload] Failed to read config:', error)
  }

  return { ...DEFAULT_UPLOAD_CONFIG }
}

/**
 * 설정 저장
 */
export async function setUploadConfig(config: UploadConfig): Promise<void> {
  const configPath = getConfigPath()

  try {
    await fse.ensureDir(getConfigDir())
    await fse.writeJSON(configPath, config, { spaces: 2 })
    console.log('[Axon Upload] Config saved')
  } catch (error) {
    console.error('[Axon Upload] Failed to save config:', error)
    throw error
  }
}

/**
 * 마이그레이션 적용
 */
function applyMigrations(config: UploadConfig): UploadConfig {
  // 현재는 마이그레이션 없음
  // 향후 버전 업그레이드 시 추가
  return config
}
