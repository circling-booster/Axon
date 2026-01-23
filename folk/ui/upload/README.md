# Upload Manager UI

Cloudflare Tunnel을 통해 로컬 파일을 외부에서 접근 가능하게 만드는 기능의 UI입니다.

## 구조

```
upload/
├── atoms/              # Jotai 상태 관리
│   └── uploadManagerState.ts
├── components/         # React 컴포넌트
│   ├── UploadSettings.tsx    # 설정 페이지 UI
│   ├── UploadToggle.tsx      # 채팅 입력창 토글
│   ├── UploadProgress.tsx    # 업로드 진행 표시
│   └── DownloadProgress.tsx  # cloudflared 다운로드 진행
├── hooks/              # Custom hooks
│   └── useUploadManager.ts
├── providers/          # Upload provider 구현
│   ├── index.ts              # Provider 인터페이스
│   ├── LocalProvider.ts      # 기존 Dive 래퍼
│   ├── CloudflareProvider.ts # Cloudflare Tunnel
│   └── S3Provider.ts         # AWS S3 (뼈대)
├── styles/             # SCSS 스타일
│   └── _Upload.scss
└── index.ts            # 모듈 진입점
```

## Provider 패턴

다양한 업로드 방식을 지원하기 위한 Provider 패턴을 사용합니다.

```typescript
interface UploadProvider {
  type: UploadProviderType
  name: string
  initialize(): Promise<void>
  upload(file: File): Promise<UploadedFile>
  getExternalUrl(file: UploadedFile): Promise<string | null>
  markAsSent(fileIds: string[]): Promise<void>
  cleanup(): Promise<void>
  isReady(): boolean
}
```

### 지원 Provider

| Provider | 설명 | 상태 |
|----------|------|------|
| Local | 기존 Dive 로컬 저장 | 완료 |
| Cloudflare | Quick Tunnel 사용 | 완료 |
| S3 | AWS S3 업로드 | 뼈대만 |

## 주요 컴포넌트

### UploadSettings
Settings 페이지에서 사용하는 설정 UI입니다.
- Provider 선택
- 터널 생명주기 설정
- URL 만료 시간 설정

### UploadToggle
채팅 입력창에 표시되는 인라인 토글입니다.
- 터널 상태 표시
- 원클릭 터널 시작/중지

## IPC 이벤트

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `axon:upload:startTunnel` | UI → Main | 터널 시작 |
| `axon:upload:stopTunnel` | UI → Main | 터널 중지 |
| `axon:upload:registerFile` | UI → Main | 파일 등록 |
| `axon:upload:markAsSent` | UI → Main | 전송 완료 표시 |
| `axon:upload:tunnelRestarted` | Main → UI | 터널 재시작 알림 |

## 사용법

```tsx
import { UploadSettings, UploadToggle } from '@/folk/ui/upload'

// 설정 페이지
<UploadSettings />

// 채팅 입력창
<UploadToggle />
```
