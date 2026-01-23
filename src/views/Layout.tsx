import React, { useEffect } from "react"
import { Outlet } from "react-router-dom"
import HistorySidebar from "../components/HistorySidebar"
import Header from "../components/Header"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { isConfigNotInitializedAtom } from "../atoms/configState"
import GlobalToast from "../components/GlobalToast"
import { themeAtom, systemThemeAtom } from "../atoms/themeState"
import Overlay from "./Overlay"
import KeymapModal from "../components/Modal/KeymapModal"
import RenameConfirmModal from "../components/Modal/RenameConfirmModal"
import CodeModal from "./Chat/CodeModal"
import { overlaysAtom } from "../atoms/layerState"
import { showToastAtom } from "../atoms/toastState"
import { useStartupExecution } from "../../folk/ui/startup" // [AXON]

const Layout = () => {
  const isConfigNotInitialized = useAtomValue(isConfigNotInitializedAtom)
  const [theme] = useAtom(themeAtom)
  const [systemTheme] = useAtom(systemThemeAtom)
  const overlays = useAtomValue(overlaysAtom)
  const showToast = useSetAtom(showToastAtom)

  useStartupExecution() // [AXON] Startup Prompts 실행 리스너

  // [AXON] 사용자 액션 필요 알림 수신
  useEffect(() => {
    const handler = (_: unknown, action: { type: string; message: string }) => {
      if (action.type === "chrome-not-installed") {
        showToast({
          message: action.message,
          type: "warning",
          duration: 10000,
          closable: true,
        })
      } else {
        // 기타 알림 타입
        showToast({
          message: action.message,
          type: "info",
          duration: 8000,
          closable: true,
        })
      }
    }

    window.ipcRenderer?.on("axon:user-action-required", handler)
    return () => {
      window.ipcRenderer?.off("axon:user-action-required", handler)
    }
  }, [showToast])

  return (
    <div className="app-container" data-theme={theme === "system" ? systemTheme : theme}>
      <div className="app-content">
        {!isConfigNotInitialized && <HistorySidebar />}
        <div className="outlet-container">
          {!isConfigNotInitialized && <Header showHelpButton={overlays.length === 0} showModelSelect={overlays.length === 0} />}
          <Outlet />
        </div>
        <CodeModal />
      </div>
      <Overlay />
      <GlobalToast />
      <KeymapModal />
      <RenameConfirmModal />
    </div>
  )
}

export default React.memo(Layout)
