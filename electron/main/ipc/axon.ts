/**
 * Axon IPC Handlers
 *
 * Axon 전용 IPC 핸들러 (Main → Renderer 통신)
 */

import { BrowserWindow } from "electron"
import type { UserActionNotification } from "../../../folk/mcp-servers/types"

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
 * 현재는 Main → Renderer 단방향 통신만 사용
 * 향후 필요 시 ipcMain.handle() 추가 가능
 */
export function ipcAxonHandler(_win: BrowserWindow) {
  // 현재는 등록할 핸들러 없음
  // notifyUserAction은 folk/mcp-servers에서 직접 호출
  console.log("[Axon IPC] Handler registered")
}
