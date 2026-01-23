/**
 * PromptList - 드래그앤드롭 프롬프트 목록
 *
 * 프롬프트 목록을 표시하고 드래그앤드롭으로 순서를 변경할 수 있습니다.
 */

import React, { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAtom, useSetAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import {
  startupConfigAtom,
  editingPromptAtom,
  updatePromptAtom,
  deletePromptAtom,
  reorderPromptsAtom
} from '../atoms/startupState'
import type { StartupPrompt } from '../../../shared/types/startup'

interface SortablePromptItemProps {
  prompt: StartupPrompt
  onEdit: (prompt: StartupPrompt) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

const SortablePromptItem: React.FC<SortablePromptItemProps> = ({
  prompt,
  onEdit,
  onDelete,
  onToggle
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: prompt.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`prompt-item ${prompt.enabled ? 'enabled' : 'disabled'}`}
    >
      <div className="prompt-drag-handle" {...attributes} {...listeners}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 4h2v2H4V4zm6 0h2v2h-2V4zM4 7h2v2H4V7zm6 0h2v2h-2V7zm-6 3h2v2H4v-2zm6 0h2v2h-2v-2z" />
        </svg>
      </div>

      <label className="prompt-toggle">
        <input
          type="checkbox"
          checked={prompt.enabled}
          onChange={(e) => onToggle(prompt.id, e.target.checked)}
        />
        <span className="toggle-slider small" />
      </label>

      <div className="prompt-content">
        <div className="prompt-name">{prompt.name}</div>
        <div className="prompt-text">{prompt.prompt.substring(0, 100)}{prompt.prompt.length > 100 ? '...' : ''}</div>
      </div>

      <div className="prompt-actions">
        <button
          className="prompt-btn edit"
          onClick={() => onEdit(prompt)}
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.146 1.146a.5.5 0 01.708 0l2 2a.5.5 0 010 .708l-9 9a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l9-9zM11.207 4L12 4.793 13.207 3.5 12.5 2.793 11.207 4zm-.207 1L4 12v.5l.5.5H5l7-7-.5-.5z" />
          </svg>
        </button>
        <button
          className="prompt-btn delete"
          onClick={() => onDelete(prompt.id)}
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
            <path d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

const PromptList: React.FC = () => {
  const { t } = useTranslation()
  const [config] = useAtom(startupConfigAtom)
  const setEditingPrompt = useSetAtom(editingPromptAtom)
  const updatePrompt = useSetAtom(updatePromptAtom)
  const deletePrompt = useSetAtom(deletePromptAtom)
  const reorderPrompts = useSetAtom(reorderPromptsAtom)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const sortedPrompts = [...config.prompts].sort((a, b) => a.order - b.order)

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedPrompts.findIndex(p => p.id === active.id)
      const newIndex = sortedPrompts.findIndex(p => p.id === over.id)
      const newOrder = arrayMove(sortedPrompts, oldIndex, newIndex)
      reorderPrompts(newOrder.map(p => p.id))
    }
  }, [sortedPrompts, reorderPrompts])

  const handleEdit = useCallback((prompt: StartupPrompt) => {
    setEditingPrompt(prompt)
  }, [setEditingPrompt])

  const handleDelete = useCallback((id: string) => {
    if (confirm(t('startup.confirmDelete', 'Are you sure you want to delete this prompt?'))) {
      deletePrompt(id)
    }
  }, [deletePrompt, t])

  const handleToggle = useCallback((id: string, enabled: boolean) => {
    updatePrompt(id, { enabled })
  }, [updatePrompt])

  const handleAddNew = useCallback(() => {
    setEditingPrompt({
      id: '',
      name: '',
      prompt: '',
      enabled: true,
      order: config.prompts.length,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }, [setEditingPrompt, config.prompts.length])

  return (
    <div className="prompt-list">
      <div className="prompt-list-header">
        <h4>{t('startup.prompts', 'Prompts')}</h4>
        <button className="add-prompt-btn" onClick={handleAddNew}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z" />
          </svg>
          {t('startup.addPrompt', 'Add Prompt')}
        </button>
      </div>

      {sortedPrompts.length === 0 ? (
        <div className="prompt-list-empty">
          {t('startup.noPrompts', 'No prompts yet. Click "Add Prompt" to create one.')}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedPrompts.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="prompt-items">
              {sortedPrompts.map(prompt => (
                <SortablePromptItem
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

export default PromptList
