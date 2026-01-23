/**
 * Axon Playwright MCP - 설정 파일 관리
 *
 * Playwright MCP 설정 파일 및 스크립트 파일 관리
 */

import fse from 'fs-extra'
import path from 'path'
import type { PlaywrightMcpConfig, ConfigPaths } from '../types'
import { DEFAULT_INIT_SCRIPT, DEFAULT_INIT_PAGE } from '../config/defaultConfig'

/**
 * 설정 파일 경로들 계산
 */
export function getConfigPaths(configDir: string): ConfigPaths {
  const scriptsDir = path.join(configDir, 'playwright-mcp')

  return {
    configFile: path.join(configDir, 'playwright-mcp-config.json'),
    scriptsDir,
    initScriptFile: path.join(scriptsDir, 'initScript.js'),
    initPageFile: path.join(scriptsDir, 'initPage.ts')
  }
}

/**
 * 기본 Playwright MCP 설정 생성
 */
export function createDefaultConfig(paths: ConfigPaths, browserChannel: 'chrome' | 'msedge' = 'chrome'): PlaywrightMcpConfig {
  return {
    browser: {
      browserName: 'chromium',
      launchOptions: {
        channel: browserChannel,
        headless: false
      },
      contextOptions: {
        viewport: { width: 1920, height: 1080 }
      }
    },
    initScript: [paths.initScriptFile],
    initPage: [paths.initPageFile],
    capabilities: ['core'],
    timeouts: {
      default: 30000,
      navigation: 60000
    }
  }
}

/**
 * 설정 파일 존재 여부 확인
 */
export async function configExists(paths: ConfigPaths): Promise<boolean> {
  return fse.pathExists(paths.configFile)
}

/**
 * 스크립트 파일들 생성
 */
export async function createScriptFiles(paths: ConfigPaths): Promise<void> {
  // 스크립트 디렉토리 생성
  await fse.ensureDir(paths.scriptsDir)

  // initScript.js 생성 (없는 경우만)
  if (!(await fse.pathExists(paths.initScriptFile))) {
    await fse.writeFile(paths.initScriptFile, DEFAULT_INIT_SCRIPT)
    console.log(`[Axon Playwright] Created ${paths.initScriptFile}`)
  }

  // initPage.ts 생성 (없는 경우만)
  if (!(await fse.pathExists(paths.initPageFile))) {
    await fse.writeFile(paths.initPageFile, DEFAULT_INIT_PAGE)
    console.log(`[Axon Playwright] Created ${paths.initPageFile}`)
  }
}

/**
 * 설정 파일 생성
 */
export async function createConfigFile(
  paths: ConfigPaths,
  browserChannel: 'chrome' | 'msedge' = 'chrome'
): Promise<void> {
  // 스크립트 파일 먼저 생성
  await createScriptFiles(paths)

  // 설정 파일 생성 (없는 경우만)
  if (!(await fse.pathExists(paths.configFile))) {
    const config = createDefaultConfig(paths, browserChannel)
    await fse.writeJSON(paths.configFile, config, { spaces: 2 })
    console.log(`[Axon Playwright] Created ${paths.configFile}`)
  }
}

/**
 * 설정 파일 읽기
 */
export async function readConfig(paths: ConfigPaths): Promise<PlaywrightMcpConfig | null> {
  try {
    if (await fse.pathExists(paths.configFile)) {
      return await fse.readJSON(paths.configFile)
    }
  } catch (error) {
    console.error('[Axon Playwright] Failed to read config:', error)
  }
  return null
}

/**
 * 설정 파일 업데이트
 */
export async function updateConfig(
  paths: ConfigPaths,
  updates: Partial<PlaywrightMcpConfig>
): Promise<void> {
  const current = await readConfig(paths)
  if (current) {
    const updated = { ...current, ...updates }
    await fse.writeJSON(paths.configFile, updated, { spaces: 2 })
    console.log(`[Axon Playwright] Updated ${paths.configFile}`)
  }
}

/**
 * 모든 설정 파일 정리 (롤백용)
 */
export async function cleanupConfigFiles(paths: ConfigPaths): Promise<void> {
  try {
    // 설정 파일 삭제
    if (await fse.pathExists(paths.configFile)) {
      await fse.remove(paths.configFile)
      console.log(`[Axon Playwright] Removed ${paths.configFile}`)
    }

    // 스크립트 디렉토리 삭제
    if (await fse.pathExists(paths.scriptsDir)) {
      await fse.remove(paths.scriptsDir)
      console.log(`[Axon Playwright] Removed ${paths.scriptsDir}`)
    }
  } catch (error) {
    console.error('[Axon Playwright] Cleanup failed:', error)
  }
}
