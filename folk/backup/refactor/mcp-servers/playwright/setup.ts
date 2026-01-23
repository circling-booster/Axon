/**
 * Axon Playwright MCP - 메인 설정 로직
 *
 * Playwright MCP 서버 자동 설정의 핵심 로직
 */

import type { SetupContext, SetupResult, McpServerEntry } from '../types'
import { detectChrome, detectEdge, detectAvailableBrowser } from './utils/chromeDetector'
import { getConfigPaths, createConfigFile, configExists } from './utils/configManager'
import { PLAYWRIGHT_MCP_VERSION, PLAYWRIGHT_MCP_SERVER_NAME } from './config/defaultConfig'

/**
 * Playwright MCP 서버 설정 메인 함수
 *
 * 1. Chrome/Edge 설치 확인
 * 2. 설정 파일 생성 (없는 경우)
 * 3. MCP 서버 항목 반환
 */
export async function setup(context: SetupContext): Promise<SetupResult> {
  console.log('[Axon Playwright] Starting setup...')

  const { configDir, isDev } = context

  // 1. 브라우저 감지 (Chrome 우선, Edge 대체)
  const browser = detectAvailableBrowser()

  if (!browser.installed) {
    console.warn('[Axon Playwright] No compatible browser detected')
    return {
      success: false,
      requiresUserAction: {
        type: 'chrome-not-installed',
        message: 'Playwright MCP를 사용하려면 Chrome 또는 Edge를 설치해주세요.',
        action: {
          label: 'Chrome 다운로드',
          url: 'https://www.google.com/chrome/'
        }
      }
    }
  }

  console.log(`[Axon Playwright] Browser detected: ${browser.browserType} at ${browser.path}`)

  // 2. 설정 파일 경로 계산
  const paths = getConfigPaths(configDir)

  // 3. 설정 파일 생성 (없는 경우)
  try {
    await createConfigFile(paths, browser.browserType as 'chrome' | 'msedge')
  } catch (error) {
    console.error('[Axon Playwright] Failed to create config files:', error)
    return {
      success: false,
      error: `설정 파일 생성 실패: ${error}`,
      requiresUserAction: {
        type: 'permission-denied',
        message: `설정 파일을 생성할 수 없습니다: ${paths.configFile}`
      }
    }
  }

  // 4. MCP 서버 항목 생성
  const mcpEntry: McpServerEntry = {
    transport: 'stdio',
    enabled: true,
    command: 'npx',
    args: [
      PLAYWRIGHT_MCP_VERSION,
      '--browser', browser.browserType,
      '--config', paths.configFile
    ]
  }

  console.log('[Axon Playwright] Setup completed successfully')

  return {
    success: true,
    mcpEntry
  }
}

/**
 * 서버 이름 export
 */
export { PLAYWRIGHT_MCP_SERVER_NAME }
