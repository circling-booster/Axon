/**
 * Startup Executor - 프롬프트 실행 로직
 *
 * MCP 서버 초기화 완료 후 자동 프롬프트를 실행합니다.
 * Renderer와의 핸드셰이크를 통해 타이밍 문제를 해결합니다.
 */

import { BrowserWindow, ipcMain } from 'electron'
import { setServiceUpCallback } from '../../../electron/main/service'
import { getStartupConfig, getEnabledPrompts } from './store'

// 모듈 내부에서 사용할 윈도우 참조
let mainWindow: BrowserWindow | null = null

// 핸드셰이크 상태
let mcpServerReady = false
let rendererReady = false
let pendingPromptCount = 0

/**
 * BrowserWindow 설정
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

/**
 * 양쪽이 준비되었을 때 Startup 실행
 */
function tryExecuteStartup(): void {
  if (mcpServerReady && rendererReady && pendingPromptCount > 0) {
    console.log('[Axon Startup] Both sides ready, executing startup...')
    notifyStartupReady(pendingPromptCount)
    // 실행 후 상태 리셋 (다음 재시작을 위해)
    mcpServerReady = false
    rendererReady = false
    pendingPromptCount = 0
  }
}

/**
 * Startup 콜백 설정
 *
 * MCP 서버 초기화 완료 후 호출될 콜백을 등록합니다.
 * electron/main/service.ts의 initMCPClient()에서 호출됩니다.
 */
export function setupStartupCallback(): void {
  // Renderer ready 핸들러 등록
  ipcMain.handle('axon:startup:rendererReady', async () => {
    console.log('[Axon Startup] Renderer is ready')
    rendererReady = true
    tryExecuteStartup()
    return { received: true }
  })

  setServiceUpCallback(async (_ip: string, _port: number) => {
    console.log('[Axon Startup] MCP server ready, checking startup config...')

    try {
      const config = await getStartupConfig()

      // 비활성화되어 있으면 건너뛰기
      if (!config.enabled) {
        console.log('[Axon Startup] Startup is disabled')
        return
      }

      // 앱 시작 시 실행 설정이 아니면 건너뛰기
      if (!config.settings.runOnAppStart) {
        console.log('[Axon Startup] Run on app start is disabled')
        return
      }

      // 활성화된 프롬프트 가져오기
      const prompts = await getEnabledPrompts()

      if (prompts.length === 0) {
        console.log('[Axon Startup] No enabled prompts')
        return
      }

      console.log(`[Axon Startup] Found ${prompts.length} enabled prompt(s)`)

      // MCP 서버 준비 완료 상태 저장
      mcpServerReady = true
      pendingPromptCount = prompts.length

      // Renderer가 이미 준비되었으면 바로 실행
      tryExecuteStartup()
    } catch (error) {
      console.error('[Axon Startup] Error in startup callback:', error)
    }
  })

  console.log('[Axon Startup] Startup callback registered')
}

/**
 * Renderer에 Startup 준비 알림 전송
 */
function notifyStartupReady(promptCount: number): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('axon:startup:ready', { promptCount })
    console.log('[Axon Startup] Sent startup:ready to renderer')
  } else {
    console.warn('[Axon Startup] Cannot send notification (no window)')
  }
}

/**
 * 수동 실행 트리거
 *
 * Renderer에서 수동으로 프롬프트 실행을 요청할 때 사용
 */
export async function triggerManualExecution(): Promise<{ success: boolean; promptCount: number }> {
  const prompts = await getEnabledPrompts()

  if (prompts.length === 0) {
    return { success: false, promptCount: 0 }
  }

  notifyStartupReady(prompts.length)
  return { success: true, promptCount: prompts.length }
}

/**
 * 실행 취소 알림
 */
export function notifyExecutionCancelled(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('axon:startup:cancelled')
  }
}
