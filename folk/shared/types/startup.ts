/**
 * Axon Startup Prompts - 타입 정의
 *
 * 앱 시작 시 자동 프롬프트 실행 기능의 타입 정의
 */

/** 단일 자동 실행 프롬프트 */
export interface StartupPrompt {
  id: string
  name: string
  prompt: string
  enabled: boolean
  order: number
  createdAt: number
  updatedAt: number
  /** 이 프롬프트 실행 후 대기 시간 (ms). 없으면 defaultDelay 사용 */
  executionDelay?: number
}

/** 자동 프롬프트 설정 */
export interface StartupConfig {
  version: string
  enabled: boolean
  prompts: StartupPrompt[]
  settings: {
    runOnAppStart: boolean
    showProgressUI: boolean
    stopOnError: boolean
    /** 프롬프트 간 기본 대기 시간 (ms) */
    defaultDelay: number
  }
}

export type ExecutionStatus = 'idle' | 'waiting' | 'running' | 'completed' | 'error' | 'cancelled'

export interface PromptExecutionState {
  promptId: string
  status: ExecutionStatus
  error?: string
}

export interface StartupExecutionState {
  status: ExecutionStatus
  currentPromptIndex: number
  promptStates: PromptExecutionState[]
  startedAt?: number
  completedAt?: number
}

/** 기본 Startup 설정 */
export const DEFAULT_STARTUP_CONFIG: StartupConfig = {
  version: '1.0.0',
  enabled: false,
  prompts: [],
  settings: {
    runOnAppStart: true,
    showProgressUI: true,
    stopOnError: false,
    defaultDelay: 1000
  }
}
