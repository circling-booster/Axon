/**
 * Axon MCP Servers - 메인 모듈
 *
 * 기본 MCP 서버 관리 시스템의 진입점
 * electron/main/service.ts에서 호출됩니다.
 */

import fse from 'fs-extra'
import path from 'path'
import { app, BrowserWindow } from 'electron'
import { getEnabledServers } from './registry'
import type { SetupContext, SetupResult, McpConfig, McpServerEntry, UserActionNotification } from './types'

// 모듈 내부에서 사용할 윈도우 참조
let mainWindow: BrowserWindow | null = null

/**
 * BrowserWindow 설정 (IPC 알림용)
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

/**
 * 사용자 알림 전송 (Main → Renderer)
 */
function notifyUserAction(notification: UserActionNotification): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('axon:user-action-required', notification)
  } else {
    // 윈도우가 없으면 콘솔에만 출력
    console.warn('[Axon MCP] Cannot send notification (no window):', notification.message)
  }
}

/**
 * 설정 디렉토리 경로 가져오기
 */
function getConfigDir(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    // 개발 모드: 프로젝트 루트의 .config
    return path.join(process.cwd(), '.config')
  } else {
    // 프로덕션: 사용자 홈의 .dive/config
    return path.join(app.getPath('home'), '.dive', 'config')
  }
}

/**
 * mcp_config.json 경로
 */
function getMcpConfigPath(): string {
  return path.join(getConfigDir(), 'mcp_config.json')
}

/**
 * mcp_config.json 읽기
 */
async function readMcpConfig(): Promise<McpConfig> {
  const configPath = getMcpConfigPath()

  try {
    if (await fse.pathExists(configPath)) {
      return await fse.readJSON(configPath)
    }
  } catch (error) {
    console.warn('[Axon MCP] Failed to read mcp_config.json:', error)
  }

  return { mcpServers: {} }
}

/**
 * mcp_config.json에 서버 추가
 */
async function addServerToConfig(name: string, entry: McpServerEntry): Promise<void> {
  const configPath = getMcpConfigPath()
  const config = await readMcpConfig()

  // 이미 존재하면 건너뛰기
  if (config.mcpServers[name]) {
    console.log(`[Axon MCP] Server "${name}" already exists, skipping`)
    return
  }

  config.mcpServers[name] = entry
  await fse.writeJSON(configPath, config, { spaces: 2 })
  console.log(`[Axon MCP] Server "${name}" added to mcp_config.json`)
}

/**
 * Playwright MCP가 이미 수동으로 등록되어 있는지 확인
 */
async function isPlaywrightManuallyRegistered(): Promise<boolean> {
  const config = await readMcpConfig()

  for (const [name, entry] of Object.entries(config.mcpServers)) {
    // __AXON_PLAYWRIGHT_MCP__가 아닌 다른 이름으로 Playwright가 등록되어 있는지 확인
    if (name === '__AXON_PLAYWRIGHT_MCP__') continue

    const args = entry.args?.join(' ') || ''
    const command = entry.command || ''

    if (
      name.toLowerCase().includes('playwright') ||
      args.includes('@playwright/mcp') ||
      command.includes('playwright')
    ) {
      return true
    }
  }

  return false
}

/**
 * 실패한 설정 정리
 */
async function cleanupFailedSetup(serverName: string): Promise<void> {
  console.log(`[Axon MCP] Cleaning up failed setup for "${serverName}"`)

  // 필요한 경우 생성된 설정 파일들을 정리
  // 현재는 로그만 출력
}

/**
 * 기본 MCP 서버 등록 메인 함수
 *
 * electron/main/service.ts의 initMCPClient()에서 호출됩니다.
 */
export async function registerDefaultMcpServers(win?: BrowserWindow): Promise<void> {
  console.log('[Axon MCP] Starting default MCP servers registration...')

  // 윈도우 설정
  if (win) {
    setMainWindow(win)
  }

  const configDir = getConfigDir()
  const isDev = !app.isPackaged

  // 설정 디렉토리 확인
  await fse.ensureDir(configDir)

  // Playwright가 이미 수동으로 등록되어 있는지 확인
  if (await isPlaywrightManuallyRegistered()) {
    console.log('[Axon MCP] Playwright already registered manually, skipping auto-registration')
  }

  // 활성화된 서버들 설정
  const servers = getEnabledServers()
  console.log(`[Axon MCP] Found ${servers.length} enabled server(s) for current platform`)

  for (const server of servers) {
    console.log(`[Axon MCP] Setting up "${server.displayName}"...`)

    const context: SetupContext = {
      configDir,
      isDev,
      win: mainWindow || undefined
    }

    try {
      const result: SetupResult = await server.setup(context)

      if (result.success && result.mcpEntry) {
        // MCP 서버 등록
        await addServerToConfig(server.name, result.mcpEntry)
        console.log(`[Axon MCP] "${server.displayName}" setup completed`)
      } else if (result.requiresUserAction) {
        // 사용자 액션 필요
        console.warn(`[Axon MCP] "${server.displayName}" requires user action:`, result.requiresUserAction.message)
        notifyUserAction(result.requiresUserAction)
      } else if (result.error) {
        // 에러 발생
        console.error(`[Axon MCP] "${server.displayName}" setup failed:`, result.error)
      }
    } catch (error) {
      console.error(`[Axon MCP] "${server.displayName}" setup error:`, error)
      await cleanupFailedSetup(server.name)
    }
  }

  console.log('[Axon MCP] Default MCP servers registration completed')
}

// 타입 re-export
export type {
  DefaultMcpServer,
  SetupResult,
  SetupContext,
  McpServerEntry,
  McpConfig,
  UserActionNotification
} from './types'

// 유틸리티 re-export
export { getEnabledServers, getAvailableServers, findServer } from './registry'
