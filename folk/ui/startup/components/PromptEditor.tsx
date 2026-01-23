/**
 * PromptEditor - 프롬프트 편집 모달
 *
 * 프롬프트를 추가하거나 편집하는 모달 컴포넌트입니다.
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import {
  editingPromptAtom,
  addPromptAtom,
  updatePromptAtom
} from '../atoms/startupState'

const PromptEditor: React.FC = () => {
  const { t } = useTranslation()
  const [editingPrompt, setEditingPrompt] = useAtom(editingPromptAtom)
  const addPrompt = useSetAtom(addPromptAtom)
  const updatePrompt = useSetAtom(updatePromptAtom)

  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [executionDelay, setExecutionDelay] = useState<number | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)

  const isNewPrompt = !editingPrompt?.id

  useEffect(() => {
    if (editingPrompt) {
      setName(editingPrompt.name)
      setPrompt(editingPrompt.prompt)
      setEnabled(editingPrompt.enabled)
      setExecutionDelay(editingPrompt.executionDelay)
    }
  }, [editingPrompt])

  const handleClose = useCallback(() => {
    setEditingPrompt(null)
  }, [setEditingPrompt])

  const handleSave = useCallback(async () => {
    if (!name.trim() || !prompt.trim()) {
      return
    }

    setIsSaving(true)

    try {
      if (isNewPrompt) {
        await addPrompt({
          name: name.trim(),
          prompt: prompt.trim(),
          enabled,
          executionDelay
        })
      } else {
        await updatePrompt(editingPrompt!.id, {
          name: name.trim(),
          prompt: prompt.trim(),
          enabled,
          executionDelay
        })
      }
      handleClose()
    } catch (error) {
      console.error('Failed to save prompt:', error)
    } finally {
      setIsSaving(false)
    }
  }, [name, prompt, enabled, executionDelay, isNewPrompt, addPrompt, updatePrompt, editingPrompt, handleClose])

  if (!editingPrompt) {
    return null
  }

  return (
    <div className="prompt-editor-overlay" onClick={handleClose}>
      <div className="prompt-editor" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-editor-header">
          <h3>
            {isNewPrompt
              ? t('startup.addPrompt', 'Add Prompt')
              : t('startup.editPrompt', 'Edit Prompt')}
          </h3>
          <button className="close-btn" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        <div className="prompt-editor-body">
          <div className="form-group">
            <label>{t('startup.promptName', 'Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('startup.promptNamePlaceholder', 'Enter a name for this prompt')}
            />
          </div>

          <div className="form-group">
            <label>{t('startup.promptText', 'Prompt')}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('startup.promptTextPlaceholder', 'Enter the prompt text')}
              rows={5}
            />
          </div>

          <div className="form-group inline">
            <label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              {t('startup.enabled', 'Enabled')}
            </label>
          </div>

          <div className="form-group">
            <label>{t('startup.customDelay', 'Custom delay (ms, optional)')}</label>
            <input
              type="number"
              value={executionDelay ?? ''}
              onChange={(e) => setExecutionDelay(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder={t('startup.useDefaultDelay', 'Use default delay')}
              min={0}
              max={60000}
            />
          </div>
        </div>

        <div className="prompt-editor-footer">
          <button className="btn-cancel" onClick={handleClose}>
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!name.trim() || !prompt.trim() || isSaving}
          >
            {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromptEditor
