/**
 * Axon MCP Servers - 공통 타입 정의
 *
 * 기본 MCP 서버 관리 시스템의 타입 정의
 */

import type { BrowserWindow } from 'electron'

/**
 * MCP 서버 설정 항목 (mcp_config.json에 추가되는 형태)
 */
export interface McpServerEntry {
  transport: 'stdio' | 'sse' | 'websocket' | 'streamable'
  enabled: boolean
  command?: string
  args?: string[]
  url?: string
  headers?: Record<string, string>
  env?: Record<string, string>
  initialTimeout?: number
  toolCallTimeout?: number
}

/**
 * MCP 서버 설정 결과
 */
export interface SetupResult {
  /** 설정 성공 여부 */
  success: boolean
  /** mcp_config.json에 추가할 서버 항목 */
  mcpEntry?: McpServerEntry
  /** 에러 메시지 (실패 시) */
  error?: string
  /** UI 알림이 필요한 경우 */
  requiresUserAction?: UserActionNotification
}

/**
 * 기본 MCP 서버 정의
 */
export interface DefaultMcpServer {
  /** MCP 서버 이름 (mcp_config.json의 키, 예: __AXON_PLAYWRIGHT_MCP__) */
  name: string
  /** UI에 표시할 이름 */
  displayName: string
  /** 설명 */
  description?: string
  /** 설정 함수 */
  setup: (context: SetupContext) => Promise<SetupResult>
  /** 기본 활성화 여부 */
  enabled: boolean
  /** 플랫폼 제한 (없으면 모든 플랫폼) */
  platforms?: ('win32' | 'darwin' | 'linux')[]
}

/**
 * 설정 컨텍스트 (setup 함수에 전달)
 */
export interface SetupContext {
  /** 설정 디렉토리 경로 (.config 또는 ~/.dive/config) */
  configDir: string
  /** 개발 모드 여부 */
  isDev: boolean
  /** BrowserWindow 인스턴스 (IPC 알림용) */
  win?: BrowserWindow
}

/**
 * MCP 설정 파일 구조 (mcp_config.json)
 */
export interface McpConfig {
  mcpServers: Record<string, McpServerEntry>
}

/**
 * 알림 액션 타입
 */
export interface UserActionNotification {
  type: 'chrome-not-installed' | 'dependency-missing' | 'permission-denied' | 'other'
  message: string
  action?: {
    label: string
    url?: string
  }
}
