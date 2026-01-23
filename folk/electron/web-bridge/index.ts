/**
 * Web Bridge 모듈
 * Chrome Extension과 Axon 데스크톱 앱 간의 통신을 담당합니다.
 */

export { startLocalServer } from './proxyServer'
export type { ProxyServerConfig, ProxyResponse, ExternalRequest } from './types'
