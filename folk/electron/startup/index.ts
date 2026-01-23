/**
 * Axon Startup - 모듈 진입점
 *
 * 앱 시작 시 자동 프롬프트 실행 기능의 Electron 백엔드입니다.
 */

export { registerStartupIPC } from './ipc'
export { setupStartupCallback, setMainWindow, triggerManualExecution } from './executor'
export {
  getStartupConfig,
  setStartupConfig,
  addPrompt,
  updatePrompt,
  deletePrompt,
  reorderPrompts,
  getEnabledPrompts
} from './store'

// 타입 re-export
export type {
  StartupConfig,
  StartupPrompt,
  ExecutionStatus,
  StartupExecutionState
} from '../../shared/types/startup'
