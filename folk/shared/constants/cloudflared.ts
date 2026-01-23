/**
 * cloudflared 관련 상수
 *
 * Cloudflare Quick Tunnel 바이너리 버전 및 다운로드 URL
 */

/** cloudflared 고정 버전 (안정성 보장) */
export const CLOUDFLARED_VERSION = '2024.11.1'

/** 플랫폼별 다운로드 URL */
export const CLOUDFLARED_URLS: Record<string, string> = {
  'win32-x64': `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-windows-amd64.exe`,
  'darwin-x64': `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-darwin-amd64.tgz`,
  'darwin-arm64': `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-darwin-arm64.tgz`,
  'linux-x64': `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-linux-amd64`,
  'linux-arm64': `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-linux-arm64`
}

/** Quick Tunnel 최대 지속 시간 (8시간) */
export const MAX_TUNNEL_DURATION_MS = 8 * 60 * 60 * 1000

/** 터널 재시작 여유 시간 (10분 전) */
export const TUNNEL_RESTART_BUFFER_MS = 10 * 60 * 1000

/** 기본 URL 만료 시간 (60분) */
export const DEFAULT_URL_EXPIRE_MINUTES = 60

/**
 * 현재 플랫폼에 맞는 cloudflared 다운로드 URL 가져오기
 */
export function getCloudflaredUrl(): string | null {
  const platform = process.platform
  const arch = process.arch

  const key = `${platform}-${arch}`
  return CLOUDFLARED_URLS[key] || null
}

/**
 * 현재 플랫폼에 맞는 cloudflared 바이너리 파일명 가져오기
 */
export function getCloudflaredBinaryName(): string {
  return process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared'
}
