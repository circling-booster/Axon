/**
 * Startup State - Jotai 상태 관리
 *
 * Startup Prompts 기능의 클라이언트 상태를 관리합니다.
 */

import { atom } from 'jotai'
import type { StartupConfig, StartupPrompt, StartupExecutionState } from '../../../shared/types/startup'
import { DEFAULT_STARTUP_CONFIG } from '../../../shared/types/startup'

// 설정 상태
export const startupConfigAtom = atom<StartupConfig>(DEFAULT_STARTUP_CONFIG)

// 로딩 상태
export const isLoadingConfigAtom = atom<boolean>(false)

// 실행 상태
export const executionStateAtom = atom<StartupExecutionState>({
  status: 'idle',
  currentPromptIndex: -1,
  promptStates: []
})

// 편집 모드 상태
export const editingPromptAtom = atom<StartupPrompt | null>(null)

// 설정 로드 액션
export const loadConfigAtom = atom(
  null,
  async (get, set) => {
    set(isLoadingConfigAtom, true)
    try {
      const config = await window.ipcRenderer.invoke('axon:startup:getConfig')
      set(startupConfigAtom, config)
    } catch (error) {
      console.error('[Startup] Failed to load config:', error)
    } finally {
      set(isLoadingConfigAtom, false)
    }
  }
)

// 설정 저장 액션
export const saveConfigAtom = atom(
  null,
  async (get, set, config: StartupConfig) => {
    try {
      await window.ipcRenderer.invoke('axon:startup:setConfig', config)
      set(startupConfigAtom, config)
    } catch (error) {
      console.error('[Startup] Failed to save config:', error)
      throw error
    }
  }
)

// 프롬프트 추가 액션
export const addPromptAtom = atom(
  null,
  async (get, set, prompt: Omit<StartupPrompt, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPrompt = await window.ipcRenderer.invoke('axon:startup:addPrompt', prompt)
      const config = get(startupConfigAtom)
      set(startupConfigAtom, {
        ...config,
        prompts: [...config.prompts, newPrompt]
      })
      return newPrompt
    } catch (error) {
      console.error('[Startup] Failed to add prompt:', error)
      throw error
    }
  }
)

// 프롬프트 수정 액션
export const updatePromptAtom = atom(
  null,
  async (get, set, id: string, updates: Partial<StartupPrompt>) => {
    try {
      const updatedPrompt = await window.ipcRenderer.invoke('axon:startup:updatePrompt', id, updates)
      if (updatedPrompt) {
        const config = get(startupConfigAtom)
        set(startupConfigAtom, {
          ...config,
          prompts: config.prompts.map(p => p.id === id ? updatedPrompt : p)
        })
      }
      return updatedPrompt
    } catch (error) {
      console.error('[Startup] Failed to update prompt:', error)
      throw error
    }
  }
)

// 프롬프트 삭제 액션
export const deletePromptAtom = atom(
  null,
  async (get, set, id: string) => {
    try {
      await window.ipcRenderer.invoke('axon:startup:deletePrompt', id)
      const config = get(startupConfigAtom)
      set(startupConfigAtom, {
        ...config,
        prompts: config.prompts.filter(p => p.id !== id)
      })
    } catch (error) {
      console.error('[Startup] Failed to delete prompt:', error)
      throw error
    }
  }
)

// 프롬프트 순서 변경 액션
export const reorderPromptsAtom = atom(
  null,
  async (get, set, promptIds: string[]) => {
    try {
      await window.ipcRenderer.invoke('axon:startup:reorderPrompts', promptIds)
      const config = get(startupConfigAtom)
      const reordered = promptIds
        .map((id, index) => {
          const prompt = config.prompts.find(p => p.id === id)
          return prompt ? { ...prompt, order: index } : null
        })
        .filter((p): p is StartupPrompt => p !== null)

      set(startupConfigAtom, {
        ...config,
        prompts: reordered
      })
    } catch (error) {
      console.error('[Startup] Failed to reorder prompts:', error)
      throw error
    }
  }
)

// 활성화 토글 액션
export const toggleEnabledAtom = atom(
  null,
  async (get, set, enabled: boolean) => {
    const config = get(startupConfigAtom)
    const newConfig = { ...config, enabled }
    await set(saveConfigAtom, newConfig)
  }
)

// 수동 실행 액션
export const executeManuallyAtom = atom(
  null,
  async (get, set) => {
    try {
      const result = await window.ipcRenderer.invoke('axon:startup:execute')
      return result
    } catch (error) {
      console.error('[Startup] Failed to execute:', error)
      throw error
    }
  }
)
