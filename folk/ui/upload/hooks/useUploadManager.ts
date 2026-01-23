/**
 * useUploadManager Hook
 *
 * Upload Manager 기능을 제공하는 React Hook입니다.
 */

import { useEffect, useCallback } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  uploadConfigAtom,
  isLoadingConfigAtom,
  tunnelStatusAtom,
  uploadedFilesAtom,
  downloadProgressAtom,
  isTunnelRunningAtom,
  activeFilesAtom,
  loadConfigAtom,
  saveConfigAtom,
  startTunnelAtom,
  stopTunnelAtom,
  getTunnelStatusAtom,
  uploadFileAtom,
  deleteFileAtom,
  refreshFilesAtom,
  cleanupExpiredAtom,
  updateDownloadProgressAtom,
  handleTunnelRestartedAtom
} from '../atoms/uploadManagerState'
import type { UploadConfig, UploadedFile } from '../../../shared/types/upload'

export interface UseUploadManagerReturn {
  // State
  config: UploadConfig
  isLoading: boolean
  tunnelStatus: { status: string; url?: string; startedAt?: number }
  uploadedFiles: UploadedFile[]
  activeFiles: UploadedFile[]
  downloadProgress: number | null
  isTunnelRunning: boolean

  // Actions
  loadConfig: () => Promise<void>
  saveConfig: (config: Partial<UploadConfig>) => Promise<void>
  startTunnel: () => Promise<{ url: string }>
  stopTunnel: () => Promise<void>
  refreshStatus: () => Promise<void>
  uploadFile: (file: { name: string; path: string; size: number; mimeType: string }) => Promise<UploadedFile>
  deleteFile: (fileId: string) => Promise<void>
  refreshFiles: () => Promise<UploadedFile[]>
  cleanupExpired: () => Promise<number>
  copyUrl: (url: string) => Promise<void>
}

export function useUploadManager(): UseUploadManagerReturn {
  // State
  const config = useAtomValue(uploadConfigAtom)
  const isLoading = useAtomValue(isLoadingConfigAtom)
  const tunnelStatus = useAtomValue(tunnelStatusAtom)
  const uploadedFiles = useAtomValue(uploadedFilesAtom)
  const activeFiles = useAtomValue(activeFilesAtom)
  const downloadProgress = useAtomValue(downloadProgressAtom)
  const isTunnelRunning = useAtomValue(isTunnelRunningAtom)

  // Setters
  const doLoadConfig = useSetAtom(loadConfigAtom)
  const doSaveConfig = useSetAtom(saveConfigAtom)
  const doStartTunnel = useSetAtom(startTunnelAtom)
  const doStopTunnel = useSetAtom(stopTunnelAtom)
  const doGetTunnelStatus = useSetAtom(getTunnelStatusAtom)
  const doUploadFile = useSetAtom(uploadFileAtom)
  const doDeleteFile = useSetAtom(deleteFileAtom)
  const doRefreshFiles = useSetAtom(refreshFilesAtom)
  const doCleanupExpired = useSetAtom(cleanupExpiredAtom)
  const doUpdateDownloadProgress = useSetAtom(updateDownloadProgressAtom)
  const doHandleTunnelRestarted = useSetAtom(handleTunnelRestartedAtom)

  // IPC 이벤트 리스너 설정
  useEffect(() => {
    // 다운로드 진행률 리스너
    const downloadListener = (_event: any, progress: number) => {
      doUpdateDownloadProgress(progress)
    }
    window.ipcRenderer.on('axon:upload:downloadProgress', downloadListener)

    // 터널 재시작 리스너
    const tunnelRestartListener = (_event: any, newUrl: string) => {
      doHandleTunnelRestarted(newUrl)
    }
    window.ipcRenderer.on('axon:upload:tunnelRestarted', tunnelRestartListener)

    return () => {
      window.ipcRenderer.off('axon:upload:downloadProgress', downloadListener)
      window.ipcRenderer.off('axon:upload:tunnelRestarted', tunnelRestartListener)
    }
  }, [doUpdateDownloadProgress, doHandleTunnelRestarted])

  // Actions
  const loadConfig = useCallback(async () => {
    await doLoadConfig()
  }, [doLoadConfig])

  const saveConfig = useCallback(async (newConfig: Partial<UploadConfig>) => {
    await doSaveConfig(newConfig)
  }, [doSaveConfig])

  const startTunnel = useCallback(async () => {
    return await doStartTunnel()
  }, [doStartTunnel])

  const stopTunnel = useCallback(async () => {
    await doStopTunnel()
  }, [doStopTunnel])

  const refreshStatus = useCallback(async () => {
    await doGetTunnelStatus()
  }, [doGetTunnelStatus])

  const uploadFile = useCallback(async (file: { name: string; path: string; size: number; mimeType: string }) => {
    return await doUploadFile(file)
  }, [doUploadFile])

  const deleteFile = useCallback(async (fileId: string) => {
    await doDeleteFile(fileId)
  }, [doDeleteFile])

  const refreshFiles = useCallback(async () => {
    return await doRefreshFiles()
  }, [doRefreshFiles])

  const cleanupExpired = useCallback(async () => {
    return await doCleanupExpired()
  }, [doCleanupExpired])

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch (error) {
      console.error('Failed to copy URL:', error)
      throw error
    }
  }, [])

  return {
    // State
    config,
    isLoading,
    tunnelStatus,
    uploadedFiles,
    activeFiles,
    downloadProgress,
    isTunnelRunning,

    // Actions
    loadConfig,
    saveConfig,
    startTunnel,
    stopTunnel,
    refreshStatus,
    uploadFile,
    deleteFile,
    refreshFiles,
    cleanupExpired,
    copyUrl
  }
}
