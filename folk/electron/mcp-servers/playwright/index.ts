/**
 * Axon Playwright MCP - 모듈 Export
 *
 * Playwright MCP 모듈의 공개 API
 */

// 메인 설정 함수
export { setup, PLAYWRIGHT_MCP_SERVER_NAME } from './setup'

// 타입
export type {
  PlaywrightMcpConfig,
  ChromeDetectionResult,
  ConfigPaths
} from './types'

// 유틸리티
export {
  detectChrome,
  detectEdge,
  detectAvailableBrowser
} from './utils/chromeDetector'

export {
  getConfigPaths,
  createConfigFile,
  createScriptFiles,
  readConfig,
  updateConfig,
  cleanupConfigFiles,
  configExists
} from './utils/configManager'

// 기본 설정
export {
  PLAYWRIGHT_MCP_VERSION,
  DEFAULT_INIT_SCRIPT,
  DEFAULT_INIT_PAGE
} from './config/defaultConfig'
