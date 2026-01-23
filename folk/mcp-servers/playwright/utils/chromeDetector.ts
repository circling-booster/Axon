/**
 * Axon Playwright MCP - Chrome 설치 감지
 *
 * Windows에서 Google Chrome 설치 여부를 확인합니다.
 */

import { existsSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import type { ChromeDetectionResult } from '../types'

/**
 * Windows에서 Chrome이 설치될 수 있는 경로들
 */
const CHROME_PATHS_WINDOWS = [
  // 사용자별 설치 (가장 일반적)
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  // 시스템 전역 설치 (64비트)
  path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  // 시스템 전역 설치 (32비트)
  path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
]

/**
 * macOS에서 Chrome이 설치될 수 있는 경로들 (향후 지원용)
 */
const CHROME_PATHS_MACOS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  path.join(process.env.HOME || '', 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
]

/**
 * Linux에서 Chrome이 설치될 수 있는 경로들 (향후 지원용)
 */
const CHROME_PATHS_LINUX = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]

/**
 * Chrome 버전 정보 가져오기 (Windows)
 */
function getChromeVersionWindows(chromePath: string): string | undefined {
  try {
    // Windows에서 chrome.exe --version은 GUI를 띄우므로 다른 방법 사용
    // 레지스트리에서 버전 확인 또는 파일 버전 확인
    const versionPath = path.join(path.dirname(chromePath), '..', 'chrome.VisualElementsManifest.xml')
    if (existsSync(versionPath)) {
      // 파일이 있으면 Chrome이 설치된 것으로 간주
      // 정확한 버전은 레지스트리 쿼리 필요
      return 'installed'
    }

    // 대체 방법: 레지스트리에서 버전 확인
    try {
      const output = execSync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve',
        { encoding: 'utf-8', timeout: 5000 }
      )
      if (output.includes('chrome.exe')) {
        return 'installed'
      }
    } catch {
      // 레지스트리 쿼리 실패 - 무시
    }

    return undefined
  } catch {
    return undefined
  }
}

/**
 * Chrome 설치 감지 (메인 함수)
 */
export function detectChrome(): ChromeDetectionResult {
  const platform = process.platform

  // 현재는 Windows만 지원
  if (platform !== 'win32') {
    console.log('[Axon Playwright] Chrome detection not supported on this platform:', platform)
    return { installed: false }
  }

  // Windows에서 Chrome 경로 확인
  for (const chromePath of CHROME_PATHS_WINDOWS) {
    if (existsSync(chromePath)) {
      const version = getChromeVersionWindows(chromePath)
      console.log(`[Axon Playwright] Chrome detected at: ${chromePath}`)
      return {
        installed: true,
        path: chromePath,
        version
      }
    }
  }

  console.log('[Axon Playwright] Chrome not detected')
  return { installed: false }
}

/**
 * Edge 설치 감지 (대체 브라우저)
 */
export function detectEdge(): ChromeDetectionResult {
  if (process.platform !== 'win32') {
    return { installed: false }
  }

  const edgePaths = [
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]

  for (const edgePath of edgePaths) {
    if (existsSync(edgePath)) {
      console.log(`[Axon Playwright] Edge detected at: ${edgePath}`)
      return {
        installed: true,
        path: edgePath,
        version: 'installed'
      }
    }
  }

  return { installed: false }
}

/**
 * 사용 가능한 브라우저 감지 (Chrome 우선, Edge 대체)
 */
export function detectAvailableBrowser(): ChromeDetectionResult & { browserType: 'chrome' | 'msedge' | 'none' } {
  const chrome = detectChrome()
  if (chrome.installed) {
    return { ...chrome, browserType: 'chrome' }
  }

  const edge = detectEdge()
  if (edge.installed) {
    return { ...edge, browserType: 'msedge' }
  }

  return { installed: false, browserType: 'none' }
}
