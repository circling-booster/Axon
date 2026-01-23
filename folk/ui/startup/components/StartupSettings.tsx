/**
 * StartupSettings - 메인 설정 UI
 *
 * Startup Prompts 설정 페이지 컴포넌트입니다.
 */

import React, { useEffect, useRef } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import {
  startupConfigAtom,
  isLoadingConfigAtom,
  loadConfigAtom,
  toggleEnabledAtom,
  saveConfigAtom,
  editingPromptAtom
} from '../atoms/startupState'
import PromptList from './PromptList'
import PromptEditor from './PromptEditor'
import ExecutionProgress from './ExecutionProgress'
import '../styles/_Startup.scss'

const StartupSettings: React.FC = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useAtom(startupConfigAtom)
  const isLoading = useAtomValue(isLoadingConfigAtom)
  const loadConfig = useSetAtom(loadConfigAtom)
  const toggleEnabled = useSetAtom(toggleEnabledAtom)
  const saveConfig = useSetAtom(saveConfigAtom)
  const editingPrompt = useAtomValue(editingPromptAtom)

  const loadedRef = useRef(false)
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadConfig()
    }
  }, [loadConfig])

  const handleToggleEnabled = () => {
    toggleEnabled(!config.enabled)
  }

  const handleSettingChange = (key: keyof typeof config.settings, value: boolean | number) => {
    const newConfig = {
      ...config,
      settings: {
        ...config.settings,
        [key]: value
      }
    }
    saveConfig(newConfig)
  }

  if (isLoading) {
    return (
      <div className="startup-settings">
        <div className="startup-loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="startup-settings">
      <div className="startup-header">
        <div className="startup-title">
          <h3>{t('startup.title', 'Startup Prompts')}</h3>
          <p className="startup-description">
            {t('startup.description', 'Automatically run prompts when the app starts.')}
          </p>
        </div>
        <label className="startup-toggle">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleToggleEnabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="startup-options">
            <label className="startup-option">
              <input
                type="checkbox"
                checked={config.settings.runOnAppStart}
                onChange={(e) => handleSettingChange('runOnAppStart', e.target.checked)}
              />
              <span>{t('startup.runOnAppStart', 'Run on app start')}</span>
            </label>

            <label className="startup-option">
              <input
                type="checkbox"
                checked={config.settings.showProgressUI}
                onChange={(e) => handleSettingChange('showProgressUI', e.target.checked)}
              />
              <span>{t('startup.showProgress', 'Show progress')}</span>
            </label>

            <label className="startup-option">
              <input
                type="checkbox"
                checked={config.settings.stopOnError}
                onChange={(e) => handleSettingChange('stopOnError', e.target.checked)}
              />
              <span>{t('startup.stopOnError', 'Stop on error')}</span>
            </label>

            <div className="startup-option">
              <label>{t('startup.defaultDelay', 'Delay between prompts (ms)')}</label>
              <input
                type="number"
                min={0}
                max={60000}
                step={100}
                value={config.settings.defaultDelay}
                onChange={(e) => handleSettingChange('defaultDelay', parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <PromptList />

          <ExecutionProgress />
        </>
      )}

      {editingPrompt !== null && <PromptEditor />}
    </div>
  )
}

export default StartupSettings
