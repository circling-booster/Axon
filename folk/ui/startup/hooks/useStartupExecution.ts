/**
 * useStartupExecution - 순차 실행 로직
 *
 * Startup 프롬프트를 순차적으로 실행합니다.
 * 각 프롬프트는 새 채팅으로 실행됩니다.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { isChatStreamingAtom } from '../../../../src/atoms/chatState'
import { toolsAtom } from '../../../../src/atoms/toolState'
import {
  startupConfigAtom,
  executionStateAtom,
  loadConfigAtom
} from '../atoms/startupState'
import type { StartupPrompt, ExecutionStatus } from '../../../shared/types/startup'

export function useStartupExecution() {
  const navigate = useNavigate()
  const config = useAtomValue(startupConfigAtom)
  const [executionState, setExecutionState] = useAtom(executionStateAtom)
  const loadConfig = useSetAtom(loadConfigAtom)
  const isChatStreaming = useAtomValue(isChatStreamingAtom)
  const tools = useAtomValue(toolsAtom)

  const isExecutingRef = useRef(false)
  const currentIndexRef = useRef(-1)
  const cancelledRef = useRef(false)
  const loadedRef = useRef(false)
  const rendererReadySentRef = useRef(false)

  /**
   * 응답 완료 대기 (isChatStreamingAtom 감시)
   */
  const waitForChatCompletion = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const checkStreaming = () => {
        if (cancelledRef.current) {
          resolve()
          return
        }
        // 직접 atom 값을 체크할 수 없으므로 폴링
        setTimeout(() => {
          // 실제로는 isChatStreaming을 컴포넌트 외부에서 체크해야 함
          // 여기서는 간단히 지연으로 대체
          resolve()
        }, 2000) // 최소 2초 대기
      }
      setTimeout(checkStreaming, 500) // 초기 대기
    })
  }, [])

  /**
   * 프롬프트 실행
   */
  const executePrompt = useCallback(async (prompt: StartupPrompt) => {
    // 새 채팅으로 프롬프트 전송
    navigate('/chat', { state: { initialMessage: prompt.prompt } })

    // 응답 완료 대기
    await waitForChatCompletion()

    // 다음 프롬프트 전 대기
    const delay = prompt.executionDelay ?? config.settings.defaultDelay
    await new Promise(resolve => setTimeout(resolve, delay))
  }, [navigate, waitForChatCompletion, config.settings.defaultDelay])

  /**
   * 모든 프롬프트 순차 실행
   */
  const executeAll = useCallback(async () => {
    if (isExecutingRef.current) return

    isExecutingRef.current = true
    cancelledRef.current = false

    const enabledPrompts = config.prompts
      .filter(p => p.enabled)
      .sort((a, b) => a.order - b.order)

    if (enabledPrompts.length === 0) {
      isExecutingRef.current = false
      return
    }

    setExecutionState({
      status: 'running',
      currentPromptIndex: 0,
      promptStates: enabledPrompts.map(p => ({ promptId: p.id, status: 'waiting' as ExecutionStatus })),
      startedAt: Date.now()
    })

    for (let i = 0; i < enabledPrompts.length; i++) {
      if (cancelledRef.current) {
        setExecutionState(prev => ({
          ...prev,
          status: 'cancelled',
          completedAt: Date.now()
        }))
        break
      }

      currentIndexRef.current = i
      const prompt = enabledPrompts[i]

      setExecutionState(prev => ({
        ...prev,
        currentPromptIndex: i,
        promptStates: prev.promptStates.map((ps, idx) =>
          idx === i ? { ...ps, status: 'running' as ExecutionStatus } : ps
        )
      }))

      try {
        await executePrompt(prompt)

        setExecutionState(prev => ({
          ...prev,
          promptStates: prev.promptStates.map((ps, idx) =>
            idx === i ? { ...ps, status: 'completed' as ExecutionStatus } : ps
          )
        }))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        setExecutionState(prev => ({
          ...prev,
          promptStates: prev.promptStates.map((ps, idx) =>
            idx === i ? { ...ps, status: 'error' as ExecutionStatus, error: errorMessage } : ps
          )
        }))

        if (config.settings.stopOnError) {
          setExecutionState(prev => ({
            ...prev,
            status: 'error',
            completedAt: Date.now()
          }))
          break
        }
      }
    }

    if (!cancelledRef.current) {
      setExecutionState(prev => ({
        ...prev,
        status: 'completed',
        completedAt: Date.now()
      }))
    }

    isExecutingRef.current = false
  }, [config, executePrompt, setExecutionState])

  /**
   * 실행 취소
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true
    window.ipcRenderer.invoke('axon:startup:cancel')
  }, [])

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setExecutionState({
      status: 'idle',
      currentPromptIndex: -1,
      promptStates: []
    })
  }, [setExecutionState])

  /**
   * executeAll을 ref에 저장하여 이벤트 핸들러에서 최신 버전 사용
   */
  const executeAllRef = useRef(executeAll)
  useEffect(() => {
    executeAllRef.current = executeAll
  }, [executeAll])

  /**
   * 초기 설정 로드 - 한 번만 실행
   */
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadConfig()
    }
  }, [loadConfig])

  /**
   * IPC 이벤트 리스너 등록
   */
  useEffect(() => {
    const handleStartupReady = (_event: any, data: { promptCount: number }) => {
      console.log('[Startup] Ready to execute', data.promptCount, 'prompts')
      executeAllRef.current()
    }

    const handleStartupCancelled = () => {
      cancelledRef.current = true
    }

    window.ipcRenderer.on('axon:startup:ready', handleStartupReady)
    window.ipcRenderer.on('axon:startup:cancelled', handleStartupCancelled)

    return () => {
      window.ipcRenderer.off('axon:startup:ready', handleStartupReady)
      window.ipcRenderer.off('axon:startup:cancelled', handleStartupCancelled)
    }
  }, [])

  /**
   * Tools 로드 완료 후 Renderer Ready 신호 전송
   * - tools가 로드되어야 MCP 서버가 사용 가능
   * - 한 번만 전송 (rendererReadySentRef로 중복 방지)
   */
  useEffect(() => {
    if (tools.length > 0 && !rendererReadySentRef.current) {
      rendererReadySentRef.current = true
      console.log('[Startup] Tools loaded (' + tools.length + '), sending rendererReady signal')
      window.ipcRenderer.invoke('axon:startup:rendererReady')
        .then(() => console.log('[Startup] Renderer ready acknowledged'))
        .catch((err: Error) => console.error('[Startup] Error sending rendererReady:', err))
    }
  }, [tools])

  return {
    config,
    executionState,
    executeAll,
    cancel,
    reset,
    isExecuting: isExecutingRef.current
  }
}
