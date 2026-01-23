/**
 * Web Bridge 타입 정의
 * Chrome Extension과의 통신에 사용되는 타입들
 */

/**
 * 프록시 서버 설정
 */
export interface ProxyServerConfig {
  port: number
  host: string
}

/**
 * 프록시 응답
 */
export interface ProxyResponse {
  success: boolean
  error?: string
  status?: string
  data?: unknown
}

/**
 * 외부 요청 정보
 */
export interface ExternalRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
}
