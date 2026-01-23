/**
 * Axon Startup UI - 모듈 진입점
 *
 * 자동 프롬프트 실행 기능의 UI 컴포넌트들을 export합니다.
 */

// Components
export { default as StartupSettings } from './components/StartupSettings'
export { default as PromptList } from './components/PromptList'
export { default as PromptEditor } from './components/PromptEditor'
export { default as ExecutionProgress } from './components/ExecutionProgress'

// Hooks
export { useStartupExecution } from './hooks/useStartupExecution'

// Atoms
export {
  startupConfigAtom,
  isLoadingConfigAtom,
  executionStateAtom,
  editingPromptAtom,
  loadConfigAtom,
  saveConfigAtom,
  addPromptAtom,
  updatePromptAtom,
  deletePromptAtom,
  reorderPromptsAtom,
  toggleEnabledAtom,
  executeManuallyAtom
} from './atoms/startupState'

// Types
export type {
  StartupConfig,
  StartupPrompt,
  ExecutionStatus,
  StartupExecutionState
} from '../../shared/types/startup'
