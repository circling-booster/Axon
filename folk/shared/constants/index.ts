/**
 * Axon Shared Constants - 통합 Export
 *
 * Renderer Process와 Main Process 양쪽에서 사용하는 공유 상수들
 */

export {
  CLOUDFLARED_VERSION,
  CLOUDFLARED_URLS,
  MAX_TUNNEL_DURATION_MS,
  TUNNEL_RESTART_BUFFER_MS,
  DEFAULT_URL_EXPIRE_MINUTES,
  getCloudflaredUrl,
  getCloudflaredBinaryName
} from './cloudflared'
