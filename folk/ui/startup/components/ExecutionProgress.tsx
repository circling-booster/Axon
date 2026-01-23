/**
 * ExecutionProgress - 실행 진행 UI
 *
 * Startup 프롬프트 실행 진행 상태를 표시합니다.
 */

import React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { executionStateAtom, executeManuallyAtom, startupConfigAtom } from '../atoms/startupState'
import { useStartupExecution } from '../hooks/useStartupExecution'

const ExecutionProgress: React.FC = () => {
  const { t } = useTranslation()
  const executionState = useAtomValue(executionStateAtom)
  const config = useAtomValue(startupConfigAtom)
  const executeManually = useSetAtom(executeManuallyAtom)
  const { cancel, reset } = useStartupExecution()

  const enabledPrompts = config.prompts.filter(p => p.enabled)
  const isRunning = executionState.status === 'running'
  const isCompleted = executionState.status === 'completed'
  const isError = executionState.status === 'error'
  const isCancelled = executionState.status === 'cancelled'

  const handleRun = async () => {
    try {
      await executeManually()
    } catch (error) {
      console.error('Failed to execute:', error)
    }
  }

  if (enabledPrompts.length === 0) {
    return null
  }

  return (
    <div className="execution-progress">
      <div className="execution-header">
        <h4>{t('startup.execution.title', 'Execution')}</h4>
        <div className="execution-actions">
          {!isRunning && (
            <button className="run-btn" onClick={handleRun}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.271 3.055a.5.5 0 01.52.038l6 4a.5.5 0 010 .814l-6 4A.5.5 0 016 11.5v-8a.5.5 0 01.271-.445z" />
              </svg>
              {t('startup.execution.run', 'Run Now')}
            </button>
          )}
          {isRunning && (
            <button className="cancel-btn" onClick={cancel}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 016 5h4a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5v-4z" />
              </svg>
              {t('startup.execution.cancel', 'Cancel')}
            </button>
          )}
          {(isCompleted || isError || isCancelled) && (
            <button className="reset-btn" onClick={reset}>
              {t('startup.execution.reset', 'Reset')}
            </button>
          )}
        </div>
      </div>

      {executionState.status !== 'idle' && (
        <div className="execution-status">
          <div className={`status-badge ${executionState.status}`}>
            {executionState.status === 'running' && t('startup.execution.running', 'Running...')}
            {executionState.status === 'completed' && t('startup.execution.completed', 'Completed')}
            {executionState.status === 'error' && t('startup.execution.error', 'Error')}
            {executionState.status === 'cancelled' && t('startup.execution.cancelled', 'Cancelled')}
          </div>

          {isRunning && (
            <div className="progress-info">
              {t('startup.execution.progress', 'Progress')}: {executionState.currentPromptIndex + 1} / {executionState.promptStates.length}
            </div>
          )}
        </div>
      )}

      {executionState.promptStates.length > 0 && (
        <div className="execution-list">
          {executionState.promptStates.map((ps, index) => {
            const prompt = config.prompts.find(p => p.id === ps.promptId)
            if (!prompt) return null

            return (
              <div key={ps.promptId} className={`execution-item ${ps.status}`}>
                <span className="execution-index">{index + 1}</span>
                <span className="execution-name">{prompt.name}</span>
                <span className={`execution-status-icon ${ps.status}`}>
                  {ps.status === 'waiting' && '⏳'}
                  {ps.status === 'running' && '⏳'}
                  {ps.status === 'completed' && '✓'}
                  {ps.status === 'error' && '✗'}
                </span>
                {ps.error && <span className="execution-error">{ps.error}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ExecutionProgress
