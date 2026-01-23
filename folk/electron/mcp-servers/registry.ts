/**
 * Axon MCP Servers - 기본 MCP 서버 레지스트리
 *
 * 앱 시작 시 자동으로 등록되는 기본 MCP 서버 목록
 * 새 MCP 서버를 추가하려면 이 파일에 항목을 추가하세요.
 */

import type { DefaultMcpServer } from './types'

/**
 * 기본 MCP 서버 목록
 *
 * 각 서버는 folk/mcp-servers/{서버명}/ 폴더에 구현됩니다.
 * setup 함수는 동적 import로 로드되어 필요할 때만 로드됩니다.
 */
export const defaultMcpServers: DefaultMcpServer[] = [
  {
    name: '__AXON_PLAYWRIGHT_MCP__',
    displayName: 'Playwright Browser',
    description: 'LLM 기반 브라우저 자동화 (Chrome)',
    setup: async (context) => {
      const { setup } = await import('./playwright')
      return setup(context)
    },
    enabled: true,
    platforms: ['win32'] // 현재 Windows만 지원, macOS는 추후 추가
  }

  // 향후 다른 기본 MCP 서버 추가 예시:
  // {
  //   name: '__AXON_FILESYSTEM_MCP__',
  //   displayName: 'File System',
  //   description: '파일 시스템 접근',
  //   setup: async (context) => {
  //     const { setup } = await import('./filesystem')
  //     return setup(context)
  //   },
  //   enabled: true
  // }
]

/**
 * 특정 서버 찾기
 */
export function findServer(name: string): DefaultMcpServer | undefined {
  return defaultMcpServers.find(server => server.name === name)
}

/**
 * 현재 플랫폼에서 사용 가능한 서버 필터링
 */
export function getAvailableServers(): DefaultMcpServer[] {
  const platform = process.platform as 'win32' | 'darwin' | 'linux'

  return defaultMcpServers.filter(server => {
    // 플랫폼 제한이 없으면 모든 플랫폼에서 사용 가능
    if (!server.platforms) return true
    // 플랫폼 제한이 있으면 현재 플랫폼이 포함되어야 함
    return server.platforms.includes(platform)
  })
}

/**
 * 활성화된 서버만 필터링
 */
export function getEnabledServers(): DefaultMcpServer[] {
  return getAvailableServers().filter(server => server.enabled)
}
