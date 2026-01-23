/**
 * Axon Playwright MCP - 타입 정의
 */

/**
 * Playwright MCP 설정 파일 구조 (playwright-mcp-config.json)
 */
export interface PlaywrightMcpConfig {
  browser: {
    browserName: 'chromium' | 'firefox' | 'webkit'
    launchOptions?: {
      channel?: 'chrome' | 'chrome-beta' | 'msedge' | 'msedge-beta'
      headless?: boolean
      executablePath?: string
    }
    contextOptions?: {
      viewport?: { width: number; height: number }
    }
  }
  initScript?: string[]
  initPage?: string[]
  capabilities?: ('core' | 'pdf' | 'vision')[]
  timeouts?: {
    default?: number
    navigation?: number
  }
}

/**
 * Chrome 감지 결과
 */
export interface ChromeDetectionResult {
  installed: boolean
  path?: string
  version?: string
}

/**
 * 설정 파일 경로들
 */
export interface ConfigPaths {
  /** playwright-mcp-config.json 경로 */
  configFile: string
  /** 스크립트 디렉토리 (initScript, initPage 위치) */
  scriptsDir: string
  /** initScript.js 경로 */
  initScriptFile: string
  /** initPage.ts 경로 */
  initPageFile: string
}
