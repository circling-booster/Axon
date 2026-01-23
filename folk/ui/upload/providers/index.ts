/**
 * Upload Providers - Provider Pattern 구현
 *
 * 다양한 업로드 방식을 지원하기 위한 Provider 패턴입니다.
 * 현재는 Cloudflare Quick Tunnel만 구현되어 있습니다.
 */

import type { UploadConfig, UploadedFile, TunnelStatus } from '../../../shared/types/upload'

/**
 * Upload Provider Interface
 */
export interface UploadProvider {
  /** Provider 이름 */
  readonly name: string

  /** Provider 설명 */
  readonly description: string

  /** 설정 필요 여부 */
  readonly requiresSetup: boolean

  /** 초기화 */
  initialize(): Promise<void>

  /** 터널/서비스 시작 */
  start(): Promise<{ url: string }>

  /** 터널/서비스 중지 */
  stop(): Promise<void>

  /** 상태 조회 */
  getStatus(): Promise<{ status: TunnelStatus; url?: string }>

  /** 파일 업로드 */
  uploadFile(filePath: string, expirationHours?: number): Promise<UploadedFile>

  /** 파일 삭제 */
  deleteFile(fileId: string): Promise<void>

  /** 파일 목록 조회 */
  getFiles(): Promise<UploadedFile[]>

  /** 정리 */
  cleanup(): Promise<void>
}

/**
 * Provider Registry
 */
const providers: Map<string, () => UploadProvider> = new Map()

/**
 * Provider 등록
 */
export function registerProvider(type: string, factory: () => UploadProvider): void {
  providers.set(type, factory)
}

/**
 * Provider 조회
 */
export function getProvider(type: string): UploadProvider | null {
  const factory = providers.get(type)
  return factory ? factory() : null
}

/**
 * 사용 가능한 Provider 목록
 */
export function getAvailableProviders(): string[] {
  return Array.from(providers.keys())
}

// Cloudflare Provider 기본 등록
import { CloudflareProvider } from './CloudflareProvider'
registerProvider('cloudflare', () => new CloudflareProvider())

// 향후 추가 가능한 Provider들
// import { S3Provider } from './S3Provider'
// registerProvider('s3', () => new S3Provider())
//
// import { LocalProvider } from './LocalProvider'
// registerProvider('local', () => new LocalProvider())
