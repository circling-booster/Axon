# Axon 확장: folk/ 리팩토링, 자동 프롬프트, Upload Manager 통합 구현 계획

## 개요

Axon 레이어 아키텍처를 확립하고, 세 가지 핵심 기능을 통합 구현합니다.

**목표**:
1. folk/ 폴더를 Layer 기반으로 리팩토링 (UI/Electron 분리)
2. 앱 시작 시 자동으로 LLM에 프롬프트 전송하는 기능 구현
3. Upload Manager + Cloudflare Tunnel + Cloud Storage(S3) 뼈대 구현
4. Dive 코드 수정 최소화 원칙 유지

**통합 구현 이점**:
- 폴더 구조 1회 변경으로 모든 기능 수용
- Import 경로 수정 1회
- 의존성 설치 1회
- 통합 테스트로 효율성 극대화

---

## 핵심 결정사항

| 항목 | 결정 |
|------|------|
| 폴더 구조 | Layer 분리 (`folk/ui/`, `folk/electron/`, `folk/shared/`, `folk/bin/`) |
| 프롬프트 주입 | 기존 `handleInitialMessage()` 활용 (Dive 수정 없음) |
| **프롬프트 전송** | **자동으로 전송까지 완료됨** (onSendMsg 호출) |
| **채팅 컨텍스트** | **각 프롬프트가 새 채팅** (독립적 실행) |
| 파일 서버 위치 | **Electron Main** (folk/electron/upload/) |
| **파일 서버 포트** | **동적 포트 할당** (OS가 사용 가능한 포트 자동 할당) |
| Cloudflare 인증 | Quick Tunnel (인증 불필요, 임시 URL) |
| **cloudflared 버전** | **2024.11.1 고정** (안정성 보장) |
| URL 유효 기간 | **프롬프트 전송 시점부터** 60분 |
| URL 삽입 포맷 | 각 파일 별도 줄 |
| **파일 접근 제어** | **공개 URL** (인증 없음, URL을 알면 누구나 접근 가능) |
| 터널 생명주기 | 설정 페이지에서 시작/종료 시점 선택 가능 |
| **터널 재시작 알림** | **Toast로 사용자 알림** (이미 전송된 URL은 만료됨) |
| 지원 플랫폼 | Windows, macOS, **Linux** |
| 설정 저장 | `.config/axon_startup.json`, `.config/axon_upload.json` |
| 실행 타이밍 | MCP 서버 초기화 완료 후 (`setServiceUpCallback`) |
| UI 위치 | System 설정 탭 내 섹션 + 채팅 입력창 인라인 토글 |

---

## 검증된 기존 코드 참조

코드베이스 분석을 통해 확인된 사항:

| 항목 | 위치 | 확인 내용 |
|------|------|----------|
| `isChatStreamingAtom` | `src/atoms/chatState.ts:41` | ✅ 존재, `atom<boolean>(false)` |
| `handleInitialMessage` | `src/views/Chat/index.tsx:893-908` | ✅ `onSendMsg()` 호출하여 자동 전송 |
| `setServiceUpCallback` | `electron/main/service.ts:30` | ✅ 콜백 배열에 추가, 포트 수신 후 100ms 뒤 호출 |
| 파일 업로드 | `src/components/ChatInput.tsx:160-208` | ✅ 메모리에 보관 후 FileList로 전달 |

---

## 최종 폴더 구조

```
folk/
├── README.md                        # [신규] folk/ 전체 안내
├── ui/                              # React (Renderer Process)
│   ├── README.md                    # [신규] UI 레이어 안내
│   ├── audio/                       # 기존 audio 이동
│   │   ├── README.md                # [신규] Audio Mixer 안내
│   │   ├── atoms/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── startup/                     # [신규] 자동 프롬프트 UI
│   │   ├── README.md                # [신규] Startup 기능 안내
│   │   ├── atoms/startupState.ts
│   │   ├── components/
│   │   │   ├── StartupSettings.tsx
│   │   │   ├── PromptList.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   └── ExecutionProgress.tsx
│   │   ├── hooks/
│   │   │   └── useStartupExecution.ts
│   │   ├── styles/_Startup.scss
│   │   └── index.ts
│   │
│   ├── upload/                      # [신규] Upload Manager UI
│   │   ├── README.md                # [신규] Upload Manager 안내
│   │   ├── atoms/
│   │   │   └── uploadManagerState.ts
│   │   ├── components/
│   │   │   ├── UploadSettings.tsx      # 설정 페이지용
│   │   │   ├── UploadToggle.tsx        # 채팅 입력창 인라인
│   │   │   ├── UploadProgress.tsx      # 업로드 진행 표시
│   │   │   └── DownloadProgress.tsx    # cloudflared 다운로드 진행
│   │   ├── hooks/
│   │   │   └── useUploadManager.ts
│   │   ├── providers/
│   │   │   ├── index.ts                # Provider 인터페이스
│   │   │   ├── LocalProvider.ts        # 기존 Dive 래퍼
│   │   │   ├── CloudflareProvider.ts   # Cloudflare Tunnel
│   │   │   └── S3Provider.ts           # AWS S3 (뼈대)
│   │   ├── styles/_Upload.scss
│   │   └── index.ts
│   │
│   └── shared/                      # 공유 UI 컴포넌트
│       └── README.md                # [신규]
│
├── electron/                        # Electron (Main Process)
│   ├── README.md                    # [신규] Electron 레이어 안내
│   ├── mcp-servers/                 # 기존 mcp-servers 이동
│   │   ├── README.md                # [신규] MCP 서버 안내
│   │   └── playwright/
│   │
│   ├── startup/                     # [신규] 자동 프롬프트 백엔드
│   │   ├── README.md                # [신규] Startup 백엔드 안내
│   │   ├── store.ts
│   │   ├── executor.ts
│   │   ├── ipc.ts
│   │   └── index.ts
│   │
│   ├── upload/                      # [신규] Upload Manager 백엔드
│   │   ├── README.md                # [신규] Upload 백엔드 안내
│   │   ├── fileServer.ts               # 로컬 파일 서버
│   │   ├── tunnelManager.ts            # cloudflared 프로세스 관리
│   │   ├── downloadManager.ts          # cloudflared 자동 다운로드
│   │   ├── urlTracker.ts               # URL 만료 관리
│   │   ├── store.ts                    # 설정 저장
│   │   ├── ipc.ts                      # IPC 핸들러
│   │   └── index.ts
│   │
│   └── web-bridge/                  # [리팩토링] chrome-extension 연동
│       ├── README.md                # [신규]
│       ├── proxyServer.ts              # 기존 proxyServer 이동
│       ├── types.ts                    # API 타입 정의
│       └── index.ts
│
├── shared/                          # 양쪽 공유
│   ├── README.md                    # [신규] 공유 타입 안내
│   ├── types/
│   │   ├── startup.ts
│   │   ├── upload.ts                # [신규]
│   │   ├── mcp.ts
│   │   └── index.ts
│   └── constants/
│       ├── index.ts
│       └── cloudflared.ts           # [신규] cloudflared 버전 및 URL
│
├── bin/                             # [신규] 외부 바이너리
│   └── cloudflared/
│       ├── README.md                # 다운로드 안내
│       ├── .gitkeep
│       └── .gitignore               # cloudflared* 제외
│
└── backup/                          # 백업 파일
    └── refactor/
```

---

## 파일 간 상호작용 다이어그램

### 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Renderer Process                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │  folk/ui/       │   │  folk/ui/       │   │  folk/ui/       │           │
│  │  startup/       │   │  upload/        │   │  audio/         │           │
│  │  ├─ atoms       │   │  ├─ atoms       │   │  ├─ atoms       │           │
│  │  ├─ components  │   │  ├─ components  │   │  ├─ components  │           │
│  │  └─ hooks       │   │  ├─ providers   │   │  └─ hooks       │           │
│  │                 │   │  └─ hooks       │   │                 │           │
│  └────────┬────────┘   └────────┬────────┘   └─────────────────┘           │
│           │                     │                                           │
│           │    ┌────────────────┴────────────────┐                         │
│           │    │      folk/shared/types/         │                         │
│           │    │  ├─ startup.ts                  │                         │
│           │    │  ├─ upload.ts                   │                         │
│           │    │  └─ index.ts                    │                         │
│           │    └────────────────┬────────────────┘                         │
│           │                     │                                           │
│           ▼                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    IPC (ipcRenderer)                          │          │
│  │  axon:startup:*  |  axon:upload:*                             │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ IPC Bridge
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               Main Process                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                electron/main/ipc/axon.ts                      │          │
│  │  ├─ registerAxonIPC()                                         │          │
│  │  └─ 모든 axon:* IPC 핸들러 등록                               │          │
│  └──────────────────────────────────────────────────────────────┘          │
│           │                     │                                           │
│           ▼                     ▼                                           │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │  folk/electron/ │   │  folk/electron/ │   │  folk/electron/ │           │
│  │  startup/       │   │  upload/        │   │  web-bridge/    │           │
│  │  ├─ store.ts    │   │  ├─ fileServer  │   │  ├─ proxyServer │           │
│  │  ├─ executor.ts │   │  ├─ tunnelMgr   │   │  └─ types.ts    │           │
│  │  └─ ipc.ts      │   │  ├─ urlTracker  │   │                 │           │
│  │                 │   │  └─ ipc.ts      │   │                 │           │
│  └────────┬────────┘   └────────┬────────┘   └─────────────────┘           │
│           │                     │                                           │
│           │    ┌────────────────┴────────────────┐                         │
│           │    │      folk/shared/types/         │                         │
│           │    └────────────────┬────────────────┘                         │
│           │                     │                                           │
│           ▼                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                   .config/ (설정 파일)                        │          │
│  │  ├─ axon_startup.json                                         │          │
│  │  └─ axon_upload.json                                          │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Startup 기능 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Startup 실행 흐름                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[앱 시작]
    │
    ▼
[electron/main/service.ts]
    │ initMCPClient() 호출
    │ MCP 서버 포트 수신 대기
    ▼
[setServiceUpCallback 등록] ←── [folk/electron/startup/executor.ts]
    │                              setupStartupCallback() 함수가
    │                              콜백 등록
    ▼
[MCP 서버 ready] (포트 수신)
    │
    ▼ 100ms 후
[콜백 실행] ──→ [folk/electron/startup/executor.ts]
    │              executeStartupPrompts()
    │
    ▼
[설정 확인] ←── [folk/electron/startup/store.ts]
    │              getStartupConfig()
    │              axon_startup.json 읽기
    │
    ▼ (enabled && prompts.length > 0)
[UI 알림] ──→ [ipcMain.emit('axon:startup:ready')]
    │           │
    ▼           ▼
[Renderer]  [folk/ui/startup/hooks/useStartupExecution.ts]
    │              │
    │              ▼
    │         [navigate("/chat", { state: { initialMessage } })]
    │              │
    ▼              ▼
[src/views/Chat/index.tsx:893-921]
    │ handleInitialMessage()
    │ → onSendMsg() 호출 → 자동 전송
    ▼
[isChatStreamingAtom 감시] ←── [src/atoms/chatState.ts:41]
    │ false가 될 때까지 대기
    ▼
[다음 프롬프트로 진행]
    │ executionDelay 후
    │ **새 채팅**으로 시작
    ▼
[모든 프롬프트 완료]
```

### 3. Upload Manager 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Upload Manager 흐름                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[사용자 파일 업로드] ──→ [src/components/ChatInput.tsx]
    │                      handleFiles() (메모리에 보관)
    ▼
[Cloudflare 활성화 체크] ←── [folk/ui/upload/atoms/uploadManagerState.ts]
    │
    ├─ [비활성화] → 기존 Dive 로직 (로컬 저장만)
    │
    └─ [활성화]
          │
          ▼
    [터널 상태 확인]
          │
          ├─ [터널 없음] → [터널 시작 요청]
          │                  IPC: axon:upload:startTunnel
          │                      │
          │                      ▼
          │               [folk/electron/upload/tunnelManager.ts]
          │                  start()
          │                      │
          │                      ├─ [cloudflared 없음]
          │                      │       │
          │                      │       ▼
          │                      │   [folk/electron/upload/downloadManager.ts]
          │                      │      downloadBinary()
          │                      │      버전: 2024.11.1 고정
          │                      │       │
          │                      │       ▼
          │                      │   [다운로드 진행률 UI]
          │                      │       │
          │                      │       ▼
          │                      │   [folk/bin/cloudflared/]
          │                      │
          │                      ▼
          │               [cloudflared tunnel --url localhost:PORT]
          │                      │
          │                      ▼
          │               [Quick Tunnel URL 파싱]
          │               예: https://xxx.trycloudflare.com
          │
          ├─ [터널 있음]
          │
          ▼
    [파일 서버에 등록]
          │ IPC: axon:upload:registerFile
          ▼
    [folk/electron/upload/fileServer.ts]
          │ Express 서버 (동적 포트)
          │ 파일 ID 생성 (UUID)
          │ 메모리에 파일 경로 매핑
          ▼
    [외부 URL 생성]
          │ https://xxx.trycloudflare.com/files/{uuid}
          │
          ▼
    [URL 만료 타이머 등록] ←── [folk/electron/upload/urlTracker.ts]
          │ 전송 시점부터 60분
          │
          ▼
    [프롬프트에 URL 삽입]
          │
          │ 📎 [music.mp3](https://xxx.trycloudflare.com/files/abc123)
          │ 📎 [image.png](https://xxx.trycloudflare.com/files/def456)
          │
          ▼
    [전송 버튼 활성화]
          │
          ▼
    [전송] → urlExpiresAt 갱신 (전송 시점부터 60분)
```

### 4. 터널 8시간 제한 대응

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        터널 재시작 흐름                                      │
└─────────────────────────────────────────────────────────────────────────────┘

[터널 시작] ──→ startTime 기록
    │
    ▼
[7시간 50분 경과 체크] ←── scheduleRestart()
    │                        setTimeout(7h 50m)
    ▼
[재시작 시작]
    │
    ├─ [기존 터널 종료]
    │
    ├─ [새 터널 시작]
    │
    ├─ [새 URL 발급]
    │      │
    │      ▼
    │   [URL 변경됨!]
    │      │
    │      ▼
    │   [Toast 알림] ──→ "터널이 재시작되어 URL이 변경되었습니다.
    │                     이미 전송된 URL은 더 이상 유효하지 않습니다."
    │
    └─ [새 startTime 기록]
```

---

## 데이터 모델

### 1. Startup 타입

```typescript
// folk/shared/types/startup.ts

/** 단일 자동 실행 프롬프트 */
export interface StartupPrompt {
  id: string
  name: string
  prompt: string
  enabled: boolean
  order: number
  createdAt: number
  updatedAt: number
  /** 이 프롬프트 실행 후 대기 시간 (ms). 없으면 defaultDelay 사용 */
  executionDelay?: number
}

/** 자동 프롬프트 설정 */
export interface StartupConfig {
  version: string
  enabled: boolean
  prompts: StartupPrompt[]
  settings: {
    runOnAppStart: boolean
    showProgressUI: boolean
    stopOnError: boolean
    /** 프롬프트 간 기본 대기 시간 (ms) */
    defaultDelay: number
  }
}

export type ExecutionStatus = 'idle' | 'waiting' | 'running' | 'completed' | 'error' | 'cancelled'

export interface StartupExecutionState {
  status: ExecutionStatus
  currentPromptIndex: number
  promptStates: { promptId: string; status: ExecutionStatus; error?: string }[]
  startedAt?: number
  completedAt?: number
}

/** IPC 이벤트 타입 */
export interface StartupIPCEvents {
  'axon:startup:getConfig': () => Promise<StartupConfig>
  'axon:startup:setConfig': (config: StartupConfig) => Promise<void>
  'axon:startup:ready': () => void  // Main → Renderer
  'axon:startup:execute': () => Promise<void>
  'axon:startup:cancel': () => Promise<void>
}
```

### 2. Upload 타입

```typescript
// folk/shared/types/upload.ts

/** 업로드 제공자 타입 */
export type UploadProviderType = 'local' | 'cloudflare' | 's3'

/** 터널 시작 시점 */
export type TunnelStartTrigger = 'app_start' | 'on_enable' | 'on_upload'

/** 터널 종료 시점 */
export type TunnelStopTrigger = 'app_close' | 'after_minutes' | 'manual'

/** 업로드 설정 */
export interface UploadConfig {
  version: string
  enabled: boolean
  activeProvider: UploadProviderType

  cloudflare: {
    enabled: boolean
    urlExpireMinutes: number          // 기본 60분 (프롬프트 전송 시점부터)
    autoInsertUrl: boolean            // 프롬프트에 URL 자동 삽입
    tunnelStartTrigger: TunnelStartTrigger   // 터널 시작 시점
    tunnelStopTrigger: TunnelStopTrigger     // 터널 종료 시점
    tunnelStopAfterMinutes?: number          // 'after_minutes' 선택 시 분 단위
  }

  s3: {
    enabled: boolean
    bucket?: string
    region?: string
    // 자격증명은 추후 구현
  }
}

/** 업로드된 파일 정보 */
export interface UploadedFile {
  id: string                    // UUID
  originalName: string
  localPath: string             // 메모리에서 참조하는 임시 경로
  size: number
  mimeType: string
  uploadedAt: number
  externalUrl?: string          // Cloudflare URL
  urlExpiresAt?: number         // 만료 시점 (전송 시점부터 계산)
  /** URL 만료 여부 */
  isExpired?: boolean
}

/** 터널 상태 */
export type TunnelStatus = 'stopped' | 'starting' | 'running' | 'error' | 'restarting'

/** 업로드 상태 */
export interface UploadState {
  isUploading: boolean
  pendingFiles: File[]
  uploadedFiles: UploadedFile[]
  tunnelStatus: TunnelStatus
  tunnelUrl?: string
  /** 현재 사용 중인 파일 서버 포트 */
  serverPort?: number
  error?: string
  /** 터널 시작 시간 (8시간 제한 체크용) */
  tunnelStartedAt?: number
}

/** IPC 이벤트 타입 */
export interface UploadIPCEvents {
  'axon:upload:getConfig': () => Promise<UploadConfig>
  'axon:upload:setConfig': (config: UploadConfig) => Promise<void>
  'axon:upload:startTunnel': () => Promise<{ url: string; port: number }>
  'axon:upload:stopTunnel': () => Promise<void>
  'axon:upload:registerFile': (file: { name: string; path: string; size: number; mimeType: string }) => Promise<UploadedFile>
  'axon:upload:unregisterFile': (fileId: string) => Promise<void>
  'axon:upload:getTunnelStatus': () => Promise<{ status: TunnelStatus; url?: string; port?: number }>
  'axon:upload:markAsSent': (fileIds: string[]) => Promise<void>  // 전송 시점에 만료 시간 갱신
  'axon:upload:checkBinary': () => Promise<boolean>
  'axon:upload:downloadBinary': () => Promise<void>
  'axon:upload:downloadProgress': (progress: number) => void  // Main → Renderer
  'axon:upload:tunnelRestarted': (newUrl: string) => void     // Main → Renderer (재시작 알림)
}
```

### 3. cloudflared 상수

```typescript
// folk/shared/constants/cloudflared.ts

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
```

---

## 구현 상세

### 1. 프롬프트 주입 방식 (Startup)

**기존 Dive 코드 활용** - `src/views/Chat/index.tsx:893-908`:

```typescript
// handleInitialMessage가 onSendMsg()를 호출하여 자동 전송
const handleInitialMessage = useCallback(async (message: string, files?: File[]) => {
  if (files && files.length > 0) {
    const fileList = new DataTransfer()
    files.forEach(file => fileList.items.add(file))
    await onSendMsg(message, fileList.files)  // ← 자동 전송!
  } else {
    await onSendMsg(message)  // ← 자동 전송!
  }
  // ...
}, [onSendMsg, navigate, location.pathname, chatId])
```

**채팅 컨텍스트**: 각 프롬프트는 **새 채팅**으로 시작됨
- `navigate("/chat", { state: { initialMessage } })` 호출
- chatId가 없는 상태에서 시작하므로 새 채팅 생성

**장점**: Dive 채팅 시스템을 전혀 수정하지 않음

### 2. Upload Manager 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     Upload Manager                               │
│  (folk/ui/upload/atoms/uploadManagerState.ts)                   │
├──────────────────┬──────────────────┬───────────────────────────┤
│     Local        │   Cloudflare     │    Cloud Storage          │
│    (기존 Dive)   │     Tunnel       │     (AWS S3)              │
├──────────────────┼──────────────────┼───────────────────────────┤
│ FormData         │ Express Server + │ SDK Upload +              │
│ → Local Save     │ cloudflared      │ Pre-signed URL            │
│ (수정 없음)      │ → 외부 URL       │ (뼈대만)                  │
│                  │ **공개 접근**    │                           │
│                  │ **동적 포트**    │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 3. Express 파일 서버 상세

```typescript
// folk/electron/upload/fileServer.ts

import express from 'express'
import { AddressInfo } from 'net'

export class FileServer {
  private app: express.Application
  private server: ReturnType<typeof express.Application.prototype.listen> | null = null
  private files: Map<string, { path: string; name: string; mimeType: string; expiresAt?: number }> = new Map()
  private port: number = 0

  async start(): Promise<number> {
    this.app = express()

    // 파일 서빙 엔드포인트
    this.app.get('/files/:id', (req, res) => {
      const file = this.files.get(req.params.id)

      if (!file) {
        return res.status(404).send('File not found')
      }

      // 만료 체크
      if (file.expiresAt && Date.now() > file.expiresAt) {
        this.files.delete(req.params.id)
        return res.status(410).send('File expired')
      }

      res.setHeader('Content-Type', file.mimeType)
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`)
      res.sendFile(file.path)
    })

    // 헬스 체크
    this.app.get('/health', (req, res) => res.send('OK'))

    // 동적 포트 할당 (포트 0)
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(0, '127.0.0.1', () => {
        this.port = (this.server!.address() as AddressInfo).port
        console.log(`[Axon] File server started on port ${this.port}`)
        resolve(this.port)
      })

      this.server.on('error', reject)
    })
  }

  getPort(): number {
    return this.port
  }

  registerFile(id: string, path: string, name: string, mimeType: string): void {
    this.files.set(id, { path, name, mimeType })
  }

  /** 전송 시점에 만료 시간 설정 */
  markAsSent(id: string, expireMinutes: number): void {
    const file = this.files.get(id)
    if (file) {
      file.expiresAt = Date.now() + expireMinutes * 60 * 1000
    }
  }

  unregisterFile(id: string): void {
    this.files.delete(id)
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null
          this.files.clear()
          resolve()
        })
      })
    }
  }
}
```

### 4. Provider 인터페이스

```typescript
// folk/ui/upload/providers/index.ts

export interface UploadProvider {
  type: UploadProviderType
  name: string
  initialize(): Promise<void>
  upload(file: File): Promise<UploadedFile>
  getExternalUrl(file: UploadedFile): Promise<string | null>
  /** 전송 시점에 만료 시간 갱신 */
  markAsSent(fileIds: string[]): Promise<void>
  cleanup(): Promise<void>
  isReady(): boolean
}
```

---

## 앱 종료 및 Cleanup

### cleanup 로직 상세

```typescript
// electron/main/service.ts 수정

import { uploadCleanup } from '../../folk/electron/upload'

export async function cleanup() {
  console.log("cleanup")

  // [AXON] Upload Manager cleanup (터널 종료)
  await uploadCleanup().catch(console.error)

  // 기존 cleanup 로직...
  for (const child of spawned) {
    if (!child.killed) {
      child.kill("SIGTERM")
    }
  }
  spawned.clear()

  // ...
}
```

```typescript
// folk/electron/upload/index.ts

let tunnelManager: TunnelManager | null = null
let fileServer: FileServer | null = null

export async function uploadCleanup(): Promise<void> {
  console.log('[Axon] Upload cleanup starting...')

  // 터널 강제 종료
  if (tunnelManager) {
    await tunnelManager.forceStop()
    tunnelManager = null
  }

  // 파일 서버 종료
  if (fileServer) {
    await fileServer.stop()
    fileServer = null
  }

  console.log('[Axon] Upload cleanup completed')
}
```

### 비정상 종료 대응

```typescript
// electron/main/index.ts에 추가

// 비정상 종료 시에도 터널 프로세스 정리
process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await cleanup()
  process.exit(0)
})

// Windows에서 콘솔 창 닫기 이벤트
if (process.platform === 'win32') {
  process.on('SIGHUP', async () => {
    await cleanup()
    process.exit(0)
  })
}
```

---

## 구현 순서

### 사전 준비: 의존성 설치

```bash
# 모든 의존성 한 번에 설치
npm install @dnd-kit/core @dnd-kit/sortable express uuid

# 타입 정의 (devDependencies)
npm install -D @types/express @types/uuid
```

**패키징 검증**: `package.json`의 `dependencies`에 추가되므로 패키징 시 자동 포함됨.

### Phase 1: 리팩토링 (folk/ 구조 변경) + README 생성

**백업**: `folk/backup/refactor/`에 현재 구조 백업

1. **전체 폴더 구조 생성**
   ```
   folk/ui/
   folk/ui/startup/
   folk/ui/upload/
   folk/ui/shared/
   folk/electron/
   folk/electron/startup/
   folk/electron/upload/
   folk/electron/web-bridge/
   folk/shared/types/
   folk/shared/constants/
   folk/bin/cloudflared/
   ```

2. **README.md 생성** (각 폴더별)
   - `folk/README.md` - 전체 구조 안내
   - `folk/ui/README.md` - UI 레이어 안내
   - `folk/ui/audio/README.md` - Audio Mixer 안내
   - `folk/ui/startup/README.md` - Startup UI 안내
   - `folk/ui/upload/README.md` - Upload Manager UI 안내
   - `folk/electron/README.md` - Electron 레이어 안내
   - `folk/electron/startup/README.md` - Startup 백엔드 안내
   - `folk/electron/upload/README.md` - Upload 백엔드 안내
   - `folk/electron/web-bridge/README.md` - Web Bridge 안내
   - `folk/electron/mcp-servers/README.md` - MCP 서버 안내
   - `folk/shared/README.md` - 공유 타입/상수 안내
   - `folk/bin/cloudflared/README.md` - cloudflared 바이너리 안내

3. **파일 이동**
   - `folk/audio/` → `folk/ui/audio/`
   - `folk/mcp-servers/` → `folk/electron/mcp-servers/`
   - `folk/proxyServer.ts` → `folk/electron/web-bridge/proxyServer.ts`

4. **모듈 생성**
   - `folk/electron/web-bridge/index.ts` (proxyServer export)
   - `folk/electron/web-bridge/types.ts` (향후 확장용)

5. **Import 경로 수정**
   | 파일 | 변경 전 | 변경 후 |
   |------|---------|---------|
   | `src/views/Chat/index.tsx` | `../../../folk/audio` | `../../../folk/ui/audio` |
   | `src/styles/index.scss` | `../../folk/audio/styles` | `../../folk/ui/audio/styles` |
   | `electron/main/index.ts` | `../../folk/proxyServer` | `../../folk/electron/web-bridge` |
   | `electron/main/service.ts` | `../../folk/mcp-servers` | `../../folk/electron/mcp-servers` |
   | `electron/main/ipc/axon.ts` | `../../../folk/mcp-servers/types` | `../../../folk/shared/types` |

6. **공유 타입/상수 생성**
   - `folk/shared/types/startup.ts`
   - `folk/shared/types/upload.ts`
   - `folk/shared/types/mcp.ts` (기존 타입 이동)
   - `folk/shared/types/index.ts`
   - `folk/shared/constants/cloudflared.ts`
   - `folk/shared/constants/index.ts`

7. **검증**
   ```bash
   npm run check
   npm run dev
   # Audio Mixer, Playwright MCP 정상 동작 확인
   ```

---

### Phase 2: 백엔드 구현 (Startup + Upload 병렬)

#### 2A. Startup 백엔드

1. **Electron Store**
   - `folk/electron/startup/store.ts` - axon_startup.json 관리

2. **IPC 핸들러**
   - `folk/electron/startup/ipc.ts`
     - `axon:startup:getConfig`
     - `axon:startup:setConfig`
     - `axon:startup:ready`
     - `axon:startup:execute`
     - `axon:startup:cancel`

3. **실행 로직**
   - `folk/electron/startup/executor.ts`
     - `setupStartupCallback()` - setServiceUpCallback 등록

4. **모듈 통합**
   - `folk/electron/startup/index.ts`

#### 2B. Upload 백엔드

1. **로컬 파일 서버**
   - `folk/electron/upload/fileServer.ts`
   - 동적 포트 할당 (`listen(0)`)
   - GET /files/:id - 파일 다운로드 (만료 체크 포함)
   - GET /health - 헬스 체크

2. **Tunnel Manager**
   - `folk/electron/upload/tunnelManager.ts`
   ```typescript
   export class TunnelManager {
     private process: ChildProcess | null = null
     private startTime: number = 0
     private restartTimer: NodeJS.Timeout | null = null
     private readonly MAX_TUNNEL_DURATION = 8 * 60 * 60 * 1000  // 8시간
     private readonly RESTART_BUFFER = 10 * 60 * 1000           // 10분 전

     // start() - 터널 시작, URL 반환
     // stop() - 터널 중지
     // forceStop() - 강제 종료 (cleanup용)
     // restart() - 8시간 제한 대응 재시작
     // watchHealth() - 터널 상태 모니터링

     private scheduleRestart() {
       this.restartTimer = setTimeout(
         () => this.restart(),
         this.MAX_TUNNEL_DURATION - this.RESTART_BUFFER
       )
     }

     async restart(): Promise<string> {
       // 기존 터널 종료
       await this.stop()
       // 새 터널 시작
       const newUrl = await this.start()
       // 재시작 알림 (IPC 이벤트)
       ipcMain.emit('axon:upload:tunnelRestarted', newUrl)
       return newUrl
     }
   }
   ```

3. **Download Manager**
   - `folk/electron/upload/downloadManager.ts`
   - cloudflared 2024.11.1 버전 다운로드
   - 진행률 콜백 지원
   - macOS tgz 압축 해제

4. **URL Tracker**
   - `folk/electron/upload/urlTracker.ts`
   - 전송 시점부터 만료 시간 관리
   - cleanupExpired() - 만료된 파일 정리

5. **Electron Store**
   - `folk/electron/upload/store.ts` - axon_upload.json 관리

6. **IPC 핸들러**
   - `folk/electron/upload/ipc.ts`
     - `axon:upload:startTunnel`
     - `axon:upload:stopTunnel`
     - `axon:upload:registerFile`
     - `axon:upload:unregisterFile`
     - `axon:upload:getTunnelStatus`
     - `axon:upload:getConfig`
     - `axon:upload:setConfig`
     - `axon:upload:markAsSent`
     - `axon:upload:checkBinary`
     - `axon:upload:downloadBinary`

7. **모듈 통합**
   - `folk/electron/upload/index.ts`
   - `uploadCleanup()` 함수 export

#### 2C. IPC 등록 (Dive 수정)

- `electron/main/ipc/axon.ts` 수정 - startup + upload IPC 등록
- `electron/main/service.ts` 수정 - setupStartupCallback 호출, cleanup 추가

---

### Phase 3: UI 구현 (Startup + Upload 병렬)

#### 3A. Startup UI

1. **Jotai Atoms**
   - `folk/ui/startup/atoms/startupState.ts`

2. **컴포넌트**
   - `StartupSettings.tsx` - 메인 설정 UI
   - `PromptList.tsx` - 드래그앤드롭 목록
   - `PromptEditor.tsx` - 편집 모달
   - `ExecutionProgress.tsx` - 실행 진행 UI

3. **훅**
   - `useStartupExecution.ts` - 순차 실행 로직

4. **스타일**
   - `_Startup.scss`

#### 3B. Upload UI

1. **Jotai Atoms**
   - `folk/ui/upload/atoms/uploadManagerState.ts`

2. **Providers**
   - `index.ts` - 인터페이스 정의
   - `LocalProvider.ts` - 기존 Dive 래퍼
   - `CloudflareProvider.ts` - Tunnel 연동
   - `S3Provider.ts` - 뼈대만 (미구현 표시)

3. **컴포넌트**
   - `UploadSettings.tsx` - 설정 페이지 (터널 생명주기 설정 포함)
   - `UploadToggle.tsx` - 채팅 입력창 인라인 (터널 상태 표시)
   - `UploadProgress.tsx` - 업로드 진행
   - `DownloadProgress.tsx` - cloudflared 다운로드 진행

4. **훅**
   - `useUploadManager.ts`

5. **스타일**
   - `_Upload.scss`

#### 3C. Dive 통합 (최소 수정)

- `src/views/Layout.tsx` - IPC 리스너 추가 (startup ready, tunnel restarted)
- `src/views/Overlay/System.tsx` - StartupSettings + UploadSettings 섹션
- `src/styles/index.scss` - 스타일 import 추가

---

### Phase 4: ChatInput 통합 (Upload 전용)

1. **UploadToggle 버튼 추가**
   - `src/components/ChatInput.tsx`에 인라인 토글 버튼

2. **useUploadManager 훅 연동**
   ```typescript
   // Cloudflare 활성화 시:
   // 1. 파일 업로드 → URL 생성 대기
   // 2. 전송 버튼 임시 비활성화
   // 3. URL 프롬프트에 자동 삽입
   // 4. 전송 버튼 활성화
   ```

3. **URL 삽입 포맷** (각 파일 별도 줄)
   ```
   📎 [music.mp3](https://xxx.trycloudflare.com/files/abc123)
   📎 [image.png](https://xxx.trycloudflare.com/files/def456)
   📎 [document.pdf](https://xxx.trycloudflare.com/files/ghi789)
   ```

4. **URL 만료 시점**
   - URL 생성 시점이 아닌 **프롬프트 전송 시점**부터 60분
   - 구현: 전송 버튼 클릭 시 `axon:upload:markAsSent` 호출

---

### Phase 5: cloudflared 바이너리 관리

**배포 방식**: 첫 실행 시 자동 다운로드

1. **다운로드 관리자 구현**
   - `folk/electron/upload/downloadManager.ts`
   - 고정 버전: **2024.11.1**
   - GitHub Releases에서 다운로드

2. **바이너리 저장 위치**
   ```
   # 개발 모드
   folk/bin/cloudflared/cloudflared.exe (Windows)
   folk/bin/cloudflared/cloudflared (macOS/Linux)

   # 프로덕션 (패키징 후)
   {userData}/bin/cloudflared/cloudflared.exe
   ```

3. **다운로드 트리거 시점**
   - Cloudflare Tunnel 활성화 시 (설정에서 토글 ON)
   - 바이너리 없으면 자동 다운로드 시작
   - 진행률 UI 표시

4. **에러 처리**
   | 시나리오 | 처리 |
   |---------|------|
   | 네트워크 오류 | 재시도 버튼 표시 |
   | 다운로드 중단 | 부분 파일 삭제, 재시도 |
   | 권한 오류 | 사용자에게 권한 요청 안내 |
   | GitHub 접근 제한 | 수동 다운로드 안내 링크 |

5. **folk/bin/cloudflared/ 구조**
   ```
   folk/bin/cloudflared/
   ├── README.md             # 다운로드 안내, 수동 설치 방법
   ├── .gitkeep
   └── .gitignore            # cloudflared* 제외
   ```

---

### Phase 6: 테스트 및 검증

#### 1. 타입 검사
```bash
npm run check
```

#### 2. 개발 테스트
```bash
npm run dev
```

#### 3. 기능별 테스트

**리팩토링 검증**:
- [ ] Audio Mixer 정상 동작
- [ ] Playwright MCP 정상 동작
- [ ] chrome-extension 연동 정상

**Startup 기능**:
- [ ] 설정 UI 표시 (Settings > System)
- [ ] 프롬프트 CRUD
- [ ] 드래그앤드롭 순서 변경
- [ ] 앱 재시작 시 자동 실행
- [ ] **각 프롬프트가 새 채팅으로 실행됨**
- [ ] 실행 취소
- [ ] isChatStreamingAtom 감시 정상 동작

**Upload 기능**:
- [ ] 설정 UI 표시 (Settings > System)
- [ ] 채팅 입력창 토글 버튼
- [ ] Cloudflare Tunnel 시작/중지
- [ ] **동적 포트 할당 정상 동작**
- [ ] 파일 업로드 → URL 생성
- [ ] URL 프롬프트 삽입 (각 파일 별도 줄)
- [ ] **전송 시점부터 60분 만료**
- [ ] 터널 생명주기 옵션 테스트
  - [ ] 앱 시작 시 터널 시작
  - [ ] 활성화 시 터널 시작
  - [ ] 파일 업로드 시 터널 시작
  - [ ] 앱 종료 시 터널 종료
  - [ ] N분 후 자동 터널 종료
- [ ] cloudflared **2024.11.1** 버전 자동 다운로드
- [ ] **8시간 터널 재시작 시 Toast 알림**

**Cleanup 검증**:
- [ ] 정상 종료 시 터널 프로세스 정리
- [ ] 비정상 종료 시 터널 프로세스 정리 (SIGTERM)
- [ ] Windows 콘솔 닫기 시 정리

#### 4. 패키징 테스트

```bash
# 패키징 전 의존성 확인
npm ls express uuid @dnd-kit/core @dnd-kit/sortable

# 패키징
npm run package:windows
npm run package:darwin
npm run package:linux
```

**패키징 검증 체크리스트**:
- [ ] `package.json`에 의존성 포함 확인
  - [ ] `express` in dependencies
  - [ ] `uuid` in dependencies
  - [ ] `@dnd-kit/core` in dependencies
  - [ ] `@dnd-kit/sortable` in dependencies
- [ ] `electron-builder.json` 또는 `forge.config.js`에서 `node_modules` 포함 확인
- [ ] 패키징된 앱에서 Express 서버 정상 동작
- [ ] 패키징된 앱에서 cloudflared 다운로드 경로 정상 (`userData/bin/`)
- [ ] 패키징된 앱에서 설정 파일 경로 정상 (`configDir`)

---

## Dive 수정 포인트 (최소화)

| 파일 | 변경 내용 | 라인 수 |
|------|----------|--------|
| `electron/main/service.ts` | setupStartupCallback 호출, uploadCleanup 추가 | +8 |
| `electron/main/index.ts` | SIGTERM/SIGINT 핸들러 추가 | +15 |
| `electron/main/ipc/axon.ts` | startup + upload IPC 등록 | +15 |
| `src/views/Layout.tsx` | IPC 리스너 추가 (startup ready, tunnel restarted) | +15 |
| `src/views/Overlay/System.tsx` | StartupSettings + UploadSettings | +25 |
| `src/components/ChatInput.tsx` | UploadToggle + 훅 연동 | +25 |
| `src/styles/index.scss` | 스타일 import | +2 |

**총 수정량**: 약 105줄 (모든 핵심 로직은 folk/ 내부)

---

## README.md 템플릿

### folk/README.md

```markdown
# folk/ - Axon 확장 레이어

Dive 기반 Axon의 커스텀 기능을 담는 레이어입니다.

## 구조

- `ui/` - React 컴포넌트 (Renderer Process)
- `electron/` - Electron 백엔드 (Main Process)
- `shared/` - 양쪽에서 공유하는 타입/상수
- `bin/` - 외부 바이너리 (cloudflared)

## 기능

- **Audio Mixer**: 오디오 파일 재생 관리
- **Startup Prompts**: 앱 시작 시 자동 프롬프트 실행
- **Upload Manager**: Cloudflare Tunnel을 통한 외부 파일 공유

## 원칙

- Dive 코드 수정 최소화
- folk/ 내에서 모든 로직 완결
- 명확한 레이어 분리 (UI/Electron/Shared)
```

### folk/ui/upload/README.md

```markdown
# Upload Manager UI

Cloudflare Tunnel을 통해 로컬 파일을 외부에서 접근 가능하게 만드는 기능입니다.

## 구조

- `atoms/` - Jotai 상태 관리
- `components/` - React 컴포넌트
- `hooks/` - Custom hooks
- `providers/` - Upload provider 구현
- `styles/` - SCSS 스타일

## Provider 패턴

```typescript
interface UploadProvider {
  upload(file: File): Promise<UploadedFile>
  getExternalUrl(file: UploadedFile): Promise<string | null>
  markAsSent(fileIds: string[]): Promise<void>
}
```

## 주요 컴포넌트

- `UploadSettings.tsx` - 설정 페이지 UI
- `UploadToggle.tsx` - 채팅 입력창 토글
- `UploadProgress.tsx` - 업로드 진행 표시
- `DownloadProgress.tsx` - cloudflared 다운로드 진행

## IPC 통신

`folk/electron/upload/`와 IPC로 통신합니다.
- `axon:upload:startTunnel` - 터널 시작
- `axon:upload:registerFile` - 파일 등록
- `axon:upload:markAsSent` - 전송 완료 표시
```

---

## 설정 파일

### `.config/axon_startup.json`
```json
{
  "version": "1.0.0",
  "enabled": true,
  "prompts": [],
  "settings": {
    "runOnAppStart": true,
    "showProgressUI": true,
    "stopOnError": false,
    "defaultDelay": 1000
  }
}
```

### `.config/axon_upload.json`
```json
{
  "version": "1.0.0",
  "enabled": true,
  "activeProvider": "local",
  "cloudflare": {
    "enabled": false,
    "urlExpireMinutes": 60,
    "autoInsertUrl": true,
    "tunnelStartTrigger": "on_enable",
    "tunnelStopTrigger": "app_close",
    "tunnelStopAfterMinutes": 30
  },
  "s3": {
    "enabled": false,
    "bucket": null,
    "region": null
  }
}
```

---

## 에러 처리

### Startup 에러
| 시나리오 | 처리 |
|---------|------|
| 빈 프롬프트 목록 | 실행 건너뜀 |
| MCP 초기화 실패 | 콜백 실행 안됨 |
| 프롬프트 실행 중 에러 | stopOnError 설정에 따라 중단/계속 |
| 응답 타임아웃 | 30초 후 다음 프롬프트로 진행 |
| isChatStreamingAtom 감시 실패 | 폴링으로 폴백 (100ms 간격) |

### Upload 에러
| 시나리오 | 처리 |
|---------|------|
| cloudflared 바이너리 없음 | 다운로드 안내 다이얼로그 |
| 터널 시작 실패 | Toast 알림 + 재시도 버튼 |
| 네트워크 오류 | 로컬 업로드로 폴백 |
| URL 만료 | 자동 정리 (전송 후 60분) |
| 포트 충돌 | 동적 포트 할당으로 자동 해결 |
| 8시간 터널 만료 | 자동 재시작 + Toast 알림 |
| 다운로드 실패 | 재시도 버튼 + 수동 다운로드 안내 |

### IPC 에러
| 시나리오 | 처리 |
|---------|------|
| IPC 통신 실패 | 3회 재시도 후 에러 표시 |
| 타임아웃 | 30초 후 타임아웃 처리 |

---

## 트레이드오프

### 장점
| 항목 | 설명 |
|------|------|
| **확장성** | Layer 분리 + Provider 패턴으로 향후 기능 추가 용이 |
| **Dive 독립성** | 105줄 수정으로 최소 영향 |
| **통합 효율** | 폴더 구조, 의존성, 테스트 1회 |
| **무료** | Cloudflare Quick Tunnel 무료 사용 |
| **안정성** | cloudflared 2024.11.1 고정 버전 사용 |
| **포트 안전** | 동적 포트 할당으로 충돌 방지 |

### 단점
| 항목 | 완화 방안 |
|------|----------|
| 리팩토링 리스크 | Phase 1에서 충분한 검증 |
| cloudflared 바이너리 크기 (~30MB) | 첫 실행 시 다운로드, 진행률 표시 |
| Quick Tunnel 8시간 제한 | 자동 재시작 + 사용자 알림 |
| 공개 URL 보안 | URL을 알아야만 접근 가능, 60분 만료 |

---

## 최종 검증 체크리스트

### 계획 완결성

| 항목 | 상태 |
|------|------|
| 폴더 구조 정의 | ✅ |
| README.md 생성 계획 | ✅ |
| Startup 데이터 모델 | ✅ |
| Upload 데이터 모델 | ✅ |
| Provider 인터페이스 | ✅ |
| 프롬프트 주입 방식 | ✅ (자동 전송 확인) |
| 채팅 컨텍스트 | ✅ (각 프롬프트 = 새 채팅) |
| Tunnel 관리 방식 | ✅ |
| 터널 생명주기 설정 | ✅ |
| **터널 재시작 알림** | ✅ (Toast) |
| 파일 서버 포트 | ✅ (동적 포트) |
| cloudflared 버전 | ✅ (2024.11.1 고정) |
| URL 만료 관리 | ✅ |
| URL 만료 시점 명확화 | ✅ (프롬프트 전송 시점) |
| URL 삽입 포맷 | ✅ (각 파일 별도 줄) |
| **파일 접근 제어** | ✅ (공개, 인증 없음) |
| IPC 정의 | ✅ |
| Import 경로 변경 목록 | ✅ |
| Dive 수정 포인트 | ✅ |
| **Cleanup 로직** | ✅ |
| **비정상 종료 대응** | ✅ |
| 테스트 시나리오 | ✅ |
| **패키징 검증** | ✅ |
| i18n 번역 키 | ✅ |
| 드래그앤드롭 구현 | ✅ |
| 순차 실행 로직 | ✅ |
| 설정 마이그레이션 | ✅ |
| Linux 지원 | ✅ |
| **파일 간 상호작용 다이어그램** | ✅ |

### 구현 후 확인사항

**Phase 1 완료 후**:
- [ ] `npm run check` 통과
- [ ] `npm run dev` 정상 실행
- [ ] 기존 기능 정상 (Audio, MCP, chrome-extension)
- [ ] 모든 README.md 생성 완료

**Phase 2-4 완료 후**:
- [ ] Startup 설정 UI 동작
- [ ] Upload 설정 UI 동작
- [ ] Cloudflare Tunnel 시작/중지
- [ ] 파일 URL 생성 및 삽입

**Phase 5-6 완료 후**:
- [ ] `npm run package:windows` 성공
- [ ] `npm run package:darwin` 성공
- [ ] `npm run package:linux` 성공
- [ ] 패키징된 앱에서 모든 기능 정상
- [ ] Cleanup 정상 동작

---

## 추가 구현 상세

### i18n 번역 키 (신규 추가)

```json
// src/locales/en.json, ko.json 등에 추가
{
  "startup": {
    "title": "Startup Prompts",
    "enabled": "Enable startup prompts",
    "addPrompt": "Add Prompt",
    "editPrompt": "Edit Prompt",
    "deletePrompt": "Delete Prompt",
    "execution": {
      "running": "Running startup prompts...",
      "completed": "Completed",
      "cancelled": "Cancelled"
    }
  },
  "upload": {
    "title": "File Upload Settings",
    "cloudflare": {
      "title": "Cloudflare Tunnel",
      "enabled": "Enable Cloudflare Tunnel",
      "tunnelStart": "Tunnel Start",
      "tunnelStop": "Tunnel Stop",
      "startOptions": {
        "app_start": "When app starts",
        "on_enable": "When enabled",
        "on_upload": "On first upload"
      },
      "stopOptions": {
        "app_close": "When app closes",
        "after_minutes": "After N minutes",
        "manual": "Manual only"
      },
      "urlExpire": "URL expires after (minutes)",
      "downloading": "Downloading cloudflared...",
      "tunnelStatus": "Tunnel Status",
      "tunnelRestarted": "Tunnel restarted. Previously shared URLs are no longer valid."
    },
    "s3": {
      "title": "AWS S3",
      "comingSoon": "Coming soon"
    }
  }
}
```

### 드래그앤드롭 구현 (@dnd-kit)

```typescript
// folk/ui/startup/components/PromptList.tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortablePromptItem = ({ prompt }: { prompt: StartupPrompt }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: prompt.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* 프롬프트 아이템 UI */}
    </div>
  )
}

const PromptList = () => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      // reorderPrompts 호출
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={prompts.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {prompts.map(prompt => <SortablePromptItem key={prompt.id} prompt={prompt} />)}
      </SortableContext>
    </DndContext>
  )
}
```

### 순차 실행 상세 로직 (Startup)

```typescript
// folk/ui/startup/hooks/useStartupExecution.ts

import { isChatStreamingAtom } from '../../../../src/atoms/chatState'

// 글로벌 navigate 접근
let globalNavigate: NavigateFunction | null = null
export const setNavigate = (nav: NavigateFunction) => { globalNavigate = nav }

// 응답 완료 대기 (isChatStreamingAtom 감시)
const waitForChatCompletion = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkStreaming = () => {
      const isStreaming = store.get(isChatStreamingAtom)  // src/atoms/chatState.ts:41
      if (!isStreaming) resolve()
      else setTimeout(checkStreaming, 100)  // 100ms 폴링
    }
    setTimeout(checkStreaming, 500)  // 초기 대기
  })
}

// 순차 실행 - 각 프롬프트는 새 채팅
const executePrompts = async (prompts: StartupPrompt[], config: StartupConfig) => {
  for (const prompt of prompts.filter(p => p.enabled)) {
    updatePromptState(prompt.id, 'running')

    // 새 채팅으로 시작 (chatId 없는 상태)
    globalNavigate?.("/chat", { state: { initialMessage: prompt.prompt } })

    // handleInitialMessage가 onSendMsg 호출 → 자동 전송
    await waitForChatCompletion()

    // 다음 프롬프트 전 대기
    const delay = prompt.executionDelay ?? config.settings.defaultDelay
    await new Promise(resolve => setTimeout(resolve, delay))

    updatePromptState(prompt.id, 'completed')
  }
}
```

### 설정 마이그레이션 로직

```typescript
// folk/electron/startup/store.ts, folk/electron/upload/store.ts

const CURRENT_VERSION = '1.0.0'

interface Migration {
  version: string
  migrate: (config: any) => any
}

const migrations: Migration[] = []  // 향후 버전 업그레이드 시 추가

const applyMigrations = (config: any): any => {
  let result = config
  for (const migration of migrations) {
    if (compareVersions(result.version, migration.version) < 0) {
      result = migration.migrate(result)
      result.version = migration.version
    }
  }
  return result
}
```

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 3.0.0 |
| 최종 수정 | 2026-01-23 |
| 프로젝트 | Axon (Dive Fork) |
| 대상 기능 | folk/ 리팩토링 + 자동 프롬프트 + Upload Manager |
| 이전 버전 | folk/backup/IMPLEMENTATION_PLAN_v1.md |
| cloudflared 버전 | **2024.11.1 고정** |
| 참고 자료 | [cloudflared releases](https://github.com/cloudflare/cloudflared/releases) |
