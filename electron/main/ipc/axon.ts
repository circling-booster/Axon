/**
 * Axon IPC Handlers
 *
 * Axon 전용 IPC 핸들러 (Main ↔ Renderer 통신)
 */

import { BrowserWindow } from "electron"
import type { UserActionNotification } from "../../../folk/shared/types"
import { registerStartupIPC, setMainWindow as setStartupMainWindow } from "../../../folk/electron/startup"
import { registerUploadIPC, setMainWindow as setUploadMainWindow } from "../../../folk/electron/upload"

/**
 * Renderer에 사용자 액션 필요 알림 전송
 * 예: Chrome 미설치 시 알림
 */
export function notifyUserAction(
  win: BrowserWindow,
  action: UserActionNotification
) {
  win.webContents.send("axon:user-action-required", action)
}

/**
 * Axon IPC 핸들러 등록
 * Startup, Upload 등 모든 Axon 모듈의 IPC 핸들러를 등록합니다.
 */
export function ipcAxonHandler(win: BrowserWindow) {
  // Startup 모듈 설정
  setStartupMainWindow(win)
  registerStartupIPC()

  // Upload 모듈 설정
  setUploadMainWindow(win)
  registerUploadIPC()

  console.log("[Axon IPC] All handlers registered")
}
