/**
 * Startup Store - 설정 파일 관리
 *
 * axon_startup.json 파일을 통해 자동 프롬프트 설정을 저장/로드합니다.
 */

import fse from 'fs-extra'
import path from 'path'
import { app } from 'electron'
import type { StartupConfig, StartupPrompt } from '../../shared/types/startup'
import { DEFAULT_STARTUP_CONFIG } from '../../shared/types/startup'

const CONFIG_FILENAME = 'axon_startup.json'

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
export async function getStartupConfig(): Promise<StartupConfig> {
  const configPath = getConfigPath()

  try {
    if (await fse.pathExists(configPath)) {
      const config = await fse.readJSON(configPath)
      // 마이그레이션 적용
      return applyMigrations(config)
    }
  } catch (error) {
    console.error('[Axon Startup] Failed to read config:', error)
  }

  return { ...DEFAULT_STARTUP_CONFIG }
}

/**
 * 설정 저장
 */
export async function setStartupConfig(config: StartupConfig): Promise<void> {
  const configPath = getConfigPath()

  try {
    await fse.ensureDir(getConfigDir())
    await fse.writeJSON(configPath, config, { spaces: 2 })
    console.log('[Axon Startup] Config saved')
  } catch (error) {
    console.error('[Axon Startup] Failed to save config:', error)
    throw error
  }
}

/**
 * 프롬프트 추가
 */
export async function addPrompt(prompt: Omit<StartupPrompt, 'id' | 'order' | 'createdAt' | 'updatedAt'>): Promise<StartupPrompt> {
  const config = await getStartupConfig()

  const newPrompt: StartupPrompt = {
    ...prompt,
    id: generateId(),
    order: config.prompts.length,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  config.prompts.push(newPrompt)
  await setStartupConfig(config)

  return newPrompt
}

/**
 * 프롬프트 수정
 */
export async function updatePrompt(id: string, updates: Partial<StartupPrompt>): Promise<StartupPrompt | null> {
  const config = await getStartupConfig()
  const index = config.prompts.findIndex(p => p.id === id)

  if (index === -1) {
    return null
  }

  config.prompts[index] = {
    ...config.prompts[index],
    ...updates,
    updatedAt: Date.now()
  }

  await setStartupConfig(config)
  return config.prompts[index]
}

/**
 * 프롬프트 삭제
 */
export async function deletePrompt(id: string): Promise<boolean> {
  const config = await getStartupConfig()
  const index = config.prompts.findIndex(p => p.id === id)

  if (index === -1) {
    return false
  }

  config.prompts.splice(index, 1)

  // 순서 재정렬
  config.prompts.forEach((p, i) => {
    p.order = i
  })

  await setStartupConfig(config)
  return true
}

/**
 * 프롬프트 순서 변경
 */
export async function reorderPrompts(promptIds: string[]): Promise<void> {
  const config = await getStartupConfig()

  // ID 순서대로 프롬프트 재정렬
  const reordered: StartupPrompt[] = []
  for (const id of promptIds) {
    const prompt = config.prompts.find(p => p.id === id)
    if (prompt) {
      prompt.order = reordered.length
      reordered.push(prompt)
    }
  }

  config.prompts = reordered
  await setStartupConfig(config)
}

/**
 * 활성화된 프롬프트 가져오기 (순서대로)
 */
export async function getEnabledPrompts(): Promise<StartupPrompt[]> {
  const config = await getStartupConfig()
  return config.prompts
    .filter(p => p.enabled)
    .sort((a, b) => a.order - b.order)
}

/**
 * 마이그레이션 적용
 */
function applyMigrations(config: StartupConfig): StartupConfig {
  // 현재는 마이그레이션 없음
  // 향후 버전 업그레이드 시 추가
  return config
}

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
