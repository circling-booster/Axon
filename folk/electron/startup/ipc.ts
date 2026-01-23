/**
 * Startup IPC Handlers - IPC 핸들러 등록
 *
 * Renderer Process와의 통신을 위한 IPC 핸들러를 등록합니다.
 */

import { ipcMain } from 'electron'
import {
  getStartupConfig,
  setStartupConfig,
  addPrompt,
  updatePrompt,
  deletePrompt,
  reorderPrompts,
  getEnabledPrompts
} from './store'
import { triggerManualExecution, notifyExecutionCancelled } from './executor'
import type { StartupConfig, StartupPrompt } from '../../shared/types/startup'

/**
 * Startup IPC 핸들러 등록
 */
export function registerStartupIPC(): void {
  // 설정 조회
  ipcMain.handle('axon:startup:getConfig', async (): Promise<StartupConfig> => {
    return getStartupConfig()
  })

  // 설정 저장
  ipcMain.handle('axon:startup:setConfig', async (_event, config: StartupConfig): Promise<void> => {
    await setStartupConfig(config)
  })

  // 프롬프트 추가
  ipcMain.handle('axon:startup:addPrompt', async (_event, prompt: Omit<StartupPrompt, 'id' | 'order' | 'createdAt' | 'updatedAt'>): Promise<StartupPrompt> => {
    return addPrompt(prompt)
  })

  // 프롬프트 수정
  ipcMain.handle('axon:startup:updatePrompt', async (_event, id: string, updates: Partial<StartupPrompt>): Promise<StartupPrompt | null> => {
    return updatePrompt(id, updates)
  })

  // 프롬프트 삭제
  ipcMain.handle('axon:startup:deletePrompt', async (_event, id: string): Promise<boolean> => {
    return deletePrompt(id)
  })

  // 프롬프트 순서 변경
  ipcMain.handle('axon:startup:reorderPrompts', async (_event, promptIds: string[]): Promise<void> => {
    await reorderPrompts(promptIds)
  })

  // 활성화된 프롬프트 조회
  ipcMain.handle('axon:startup:getEnabledPrompts', async (): Promise<StartupPrompt[]> => {
    return getEnabledPrompts()
  })

  // 수동 실행
  ipcMain.handle('axon:startup:execute', async (): Promise<{ success: boolean; promptCount: number }> => {
    return triggerManualExecution()
  })

  // 실행 취소
  ipcMain.handle('axon:startup:cancel', async (): Promise<void> => {
    notifyExecutionCancelled()
  })

  console.log('[Axon Startup] IPC handlers registered')
}
