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
| 파일 서버 위치 | **Electron Main** (folk/electron/upload/) |
| Cloudflare 인증 | Quick Tunnel (인증 불필요, 임시 URL) |
| URL 유효 기간 | **프롬프트 전송 시점부터** 60분 |
| URL 삽입 포맷 | 각 파일 별도 줄 |
| 터널 생명주기 | 설정 페이지에서 시작/종료 시점 선택 가능 |
| 지원 플랫폼 | Windows, macOS, **Linux** |
| 설정 저장 | `.config/axon_startup.json`, `.config/axon_upload.json` |
| 실행 타이밍 | MCP 서버 초기화 완료 후 (`setServiceUpCallback`) |
| UI 위치 | System 설정 탭 내 섹션 + 채팅 입력창 인라인 토글 |

---

## 최종 폴더 구조

```
folk/
├── ui/                              # React (Renderer Process)
│   ├── audio/                       # 기존 audio 이동
│   │   ├── atoms/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── startup/                     # [신규] 자동 프롬프트 UI
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
│   │   ├── atoms/
│   │   │   └── uploadManagerState.ts
│   │   ├── components/
│   │   │   ├── UploadSettings.tsx      # 설정 페이지용
│   │   │   ├── UploadToggle.tsx        # 채팅 입력창 인라인
│   │   │   └── UploadProgress.tsx      # 업로드 진행 표시
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
│
├── electron/                        # Electron (Main Process)
│   ├── mcp-servers/                 # 기존 mcp-servers 이동
│   │   └── playwright/
│   │
│   ├── startup/                     # [신규] 자동 프롬프트 백엔드
│   │   ├── store.ts
│   │   ├── executor.ts
│   │   ├── ipc.ts
│   │   └── index.ts
│   │
│   ├── upload/                      # [신규] Upload Manager 백엔드
│   │   ├── fileServer.ts               # 로컬 파일 서버
│   │   ├── tunnelManager.ts            # cloudflared 프로세스 관리
│   │   ├── downloadManager.ts          # cloudflared 자동 다운로드
│   │   ├── urlTracker.ts               # URL 만료 관리
│   │   ├── store.ts                    # 설정 저장
│   │   ├── ipc.ts                      # IPC 핸들러
│   │   └── index.ts
│   │
│   └── web-bridge/                  # [리팩토링] chrome-extension 연동
│       ├── proxyServer.ts              # 기존 proxyServer 이동
│       ├── types.ts                    # API 타입 정의
│       └── index.ts
│
├── shared/                          # 양쪽 공유
│   ├── types/
│   │   ├── startup.ts
│   │   ├── upload.ts                # [신규]
│   │   ├── mcp.ts
│   │   └── index.ts
│   └── constants/
│
├── bin/                             # [신규] 외부 바이너리
│   └── cloudflared/
│       ├── .gitkeep
│       └── README.md                # 다운로드 안내
│
└── backup/                          # 백업 파일
    └── refactor/
```

---

## 데이터 모델

### 1. Startup 타입 (기존)

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
```

### 2. Upload 타입 (신규)

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
  id: string
  originalName: string
  localPath: string
  size: number
  mimeType: string
  uploadedAt: number
  externalUrl?: string
  urlExpiresAt?: number
}

/** 터널 상태 */
export type TunnelStatus = 'stopped' | 'starting' | 'running' | 'error'

/** 업로드 상태 */
export interface UploadState {
  isUploading: boolean
  pendingFiles: File[]
  uploadedFiles: UploadedFile[]
  tunnelStatus: TunnelStatus
  tunnelUrl?: string
  error?: string
}
```

---

## 구현 상세

### 1. 프롬프트 주입 방식 (Startup)

**기존 Dive 코드 활용** - `src/views/Chat/index.tsx` (893-921 라인):

```typescript
// React Router navigate를 사용하여 프롬프트 주입
navigate("/chat", {
  state: { initialMessage: prompt.prompt },
  replace: false
})
```

**장점**: Dive 채팅 시스템을 전혀 수정하지 않음

### 2. Upload Manager 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Upload Manager                           │
│  (folk/ui/upload/atoms/uploadManagerState.ts)               │
├──────────────────┬──────────────────┬───────────────────────┤
│     Local        │   Cloudflare     │    Cloud Storage      │
│    (기존 Dive)   │     Tunnel       │     (AWS S3)          │
├──────────────────┼──────────────────┼───────────────────────┤
│ FormData         │ Local Server +   │ SDK Upload +          │
│ → Local Save     │ cloudflared      │ Pre-signed URL        │
│ (수정 없음)      │ → 외부 URL       │ (뼈대만)              │
└──────────────────┴──────────────────┴───────────────────────┘
```

### 3. Cloudflare Tunnel 흐름

```
[사용자 파일 업로드]
    ↓
[Upload Manager 처리]
    ↓
[파일 → folk/electron/upload/fileServer.ts]
    ↓
[cloudflared Quick Tunnel 연결]
    ↓
[외부 URL 생성] (예: https://xxx.trycloudflare.com/files/abc123)
    ↓
[프롬프트에 URL 자동 삽입]
    ↓
[전송 버튼 비활성화 해제]
    ↓
[전송 시: URL + 기존 파일 첨부 동시 전송]
    ↓
[60분 후 URL 만료]
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
  cleanup(): Promise<void>
  isReady(): boolean
}
```

---

## 구현 순서

### 사전 준비: 의존성 설치

```bash
# 모든 의존성 한 번에 설치
npm install @dnd-kit/core @dnd-kit/sortable express uuid
```

### Phase 1: 리팩토링 (folk/ 구조 변경) + Upload 폴더 포함

**백업**: `folk/backup/refactor/`에 현재 구조 백업

1. **전체 폴더 구조 생성**
   ```
   folk/ui/
   folk/ui/startup/
   folk/ui/upload/
   folk/electron/
   folk/electron/startup/
   folk/electron/upload/
   folk/electron/web-bridge/
   folk/shared/types/
   folk/bin/cloudflared/
   ```

2. **파일 이동**
   - `folk/audio/` → `folk/ui/audio/`
   - `folk/mcp-servers/` → `folk/electron/mcp-servers/`
   - `folk/proxyServer.ts` → `folk/electron/web-bridge/proxyServer.ts`

3. **모듈 생성**
   - `folk/electron/web-bridge/index.ts` (proxyServer export)
   - `folk/electron/web-bridge/types.ts` (향후 확장용)

4. **Import 경로 수정**
   | 파일 | 변경 전 | 변경 후 |
   |------|---------|---------|
   | `src/views/Chat/index.tsx` | `../../../folk/audio` | `../../../folk/ui/audio` |
   | `src/styles/index.scss` | `../../folk/audio/styles` | `../../folk/ui/audio/styles` |
   | `electron/main/index.ts` | `../../folk/proxyServer` | `../../folk/electron/web-bridge` |
   | `electron/main/service.ts` | `../../folk/mcp-servers` | `../../folk/electron/mcp-servers` |
   | `electron/main/ipc/axon.ts` | `../../../folk/mcp-servers/types` | `../../../folk/shared/types` |

5. **공유 타입 생성**
   - `folk/shared/types/startup.ts`
   - `folk/shared/types/upload.ts`
   - `folk/shared/types/mcp.ts` (기존 타입 이동)
   - `folk/shared/types/index.ts`

6. **검증**
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

3. **실행 로직**
   - `folk/electron/startup/executor.ts`
     - `setupStartupCallback()` - setServiceUpCallback 등록

4. **모듈 통합**
   - `folk/electron/startup/index.ts`

#### 2B. Upload 백엔드

1. **로컬 파일 서버**
   - `folk/electron/upload/fileServer.ts`
   ```typescript
   // Express 서버로 파일 서빙
   // GET /files/:id - 파일 다운로드 (만료 체크 포함)
   ```

2. **Tunnel Manager**
   - `folk/electron/upload/tunnelManager.ts`
   ```typescript
   // cloudflared Quick Tunnel 프로세스 관리
   export class TunnelManager {
     // start() - 터널 시작, URL 반환
     // stop() - 터널 중지
     // restart() - 8시간 제한 대응 재시작
     // watchHealth() - 터널 상태 모니터링

     private startTime: number
     private readonly MAX_TUNNEL_DURATION = 8 * 60 * 60 * 1000  // 8시간

     // 7시간 50분 후 자동 재시작 (여유 10분)
     private scheduleRestart() {
       setTimeout(() => this.restart(), this.MAX_TUNNEL_DURATION - 10 * 60 * 1000)
     }
   }
   ```

3. **URL Tracker**
   - `folk/electron/upload/urlTracker.ts`
   ```typescript
   // 60분 만료 관리
   // cleanupExpired() - 만료된 파일 정리
   ```

4. **Electron Store**
   - `folk/electron/upload/store.ts` - axon_upload.json 관리

5. **IPC 핸들러**
   - `folk/electron/upload/ipc.ts`
     - `axon:upload:startTunnel`
     - `axon:upload:stopTunnel`
     - `axon:upload:registerFile`
     - `axon:upload:getTunnelStatus`
     - `axon:upload:getConfig`
     - `axon:upload:setConfig`

6. **모듈 통합**
   - `folk/electron/upload/index.ts`

#### 2C. IPC 등록 (Dive 수정)

- `electron/main/ipc/axon.ts` 수정 - startup + upload IPC 등록
- `electron/main/service.ts` 수정 - setupStartupCallback 호출

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
     - Cloudflare 활성화 토글
     - 터널 시작 시점 선택 (드롭다운)
     - 터널 종료 시점 선택 (드롭다운)
     - 종료 대기 시간 입력 (after_minutes 선택 시)
     - URL 만료 시간 설정
   - `UploadToggle.tsx` - 채팅 입력창 인라인 (터널 상태 표시)
   - `UploadProgress.tsx` - 업로드 진행

4. **훅**
   - `useUploadManager.ts`

5. **스타일**
   - `_Upload.scss`

#### 3C. Dive 통합 (최소 수정)

- `src/views/Layout.tsx` - IPC 리스너 추가 (startup ready)
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
   - 구현: 전송 버튼 클릭 시 urlExpiresAt 갱신

---

### Phase 5: cloudflared 바이너리 관리 (자동 다운로드)

**배포 방식**: 첫 실행 시 자동 다운로드

1. **다운로드 관리자 구현**
   - `folk/electron/upload/downloadManager.ts`
   ```typescript
   // 플랫폼별 다운로드 URL (Windows, macOS, Linux 지원)
   const CLOUDFLARED_URLS = {
     'win32-x64': 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
     'darwin-x64': 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz',
     'darwin-arm64': 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz',
     'linux-x64': 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64',
     'linux-arm64': 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64'
   }

   export class DownloadManager {
     // 바이너리 존재 여부 확인
     async checkBinaryExists(): Promise<boolean>

     // 다운로드 (진행률 콜백 포함)
     async downloadBinary(onProgress: (percent: number) => void): Promise<void>

     // macOS: tgz 압축 해제
     async extractTarGz(filePath: string): Promise<void>
   }
   ```

2. **바이너리 저장 위치**
   ```
   # 개발 모드
   folk/bin/cloudflared/cloudflared.exe (Windows)
   folk/bin/cloudflared/cloudflared (macOS)

   # 프로덕션 (패키징 후)
   {userData}/bin/cloudflared/cloudflared.exe
   ```

3. **다운로드 트리거 시점**
   - Cloudflare Tunnel 활성화 시 (설정에서 토글 ON)
   - 바이너리 없으면 자동 다운로드 시작
   - 진행률 UI 표시

4. **다운로드 진행 UI**
   - `folk/ui/upload/components/DownloadProgress.tsx`
   ```typescript
   // 다운로드 진행률 표시
   // 재시도 버튼
   // 취소 버튼
   ```

5. **IPC 핸들러 추가**
   - `axon:upload:checkBinary` - 바이너리 존재 확인
   - `axon:upload:downloadBinary` - 다운로드 시작
   - `axon:upload:downloadProgress` - 진행률 이벤트

6. **에러 처리**
   | 시나리오 | 처리 |
   |---------|------|
   | 네트워크 오류 | 재시도 버튼 표시 |
   | 다운로드 중단 | 부분 파일 삭제, 재시도 |
   | 권한 오류 | 사용자에게 권한 요청 안내 |
   | GitHub 접근 제한 | 수동 다운로드 안내 링크 |

7. **folk/bin/cloudflared/ 구조**
   ```
   folk/bin/cloudflared/
   ├── .gitkeep
   └── .gitignore              # cloudflared* 제외
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
- [ ] 실행 취소

**Upload 기능**:
- [ ] 설정 UI 표시 (Settings > System)
- [ ] 채팅 입력창 토글 버튼
- [ ] Cloudflare Tunnel 시작/중지
- [ ] 파일 업로드 → URL 생성
- [ ] URL 프롬프트 삽입 (각 파일 별도 줄)
- [ ] 60분 만료 확인 (전송 시점부터)
- [ ] 터널 생명주기 옵션 테스트
  - [ ] 앱 시작 시 터널 시작
  - [ ] 활성화 시 터널 시작
  - [ ] 파일 업로드 시 터널 시작
  - [ ] 앱 종료 시 터널 종료
  - [ ] N분 후 자동 터널 종료
- [ ] cloudflared 자동 다운로드 (Windows/macOS/Linux)

#### 4. 패키징 테스트
```bash
npm run package:windows
npm run package:darwin
```

---

## Dive 수정 포인트 (최소화)

| 파일 | 변경 내용 | 라인 수 |
|------|----------|--------|
| `electron/main/service.ts` | setupStartupCallback 호출 | +3 |
| `electron/main/ipc/axon.ts` | startup + upload IPC 등록 | +10 |
| `src/views/Layout.tsx` | IPC 리스너 추가 | +10 |
| `src/views/Overlay/System.tsx` | StartupSettings + UploadSettings | +25 |
| `src/components/ChatInput.tsx` | UploadToggle + 훅 연동 | +25 |
| `src/styles/index.scss` | 스타일 import | +2 |

**총 수정량**: 약 75줄 (모든 핵심 로직은 folk/ 내부)

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

### 터널 생명주기 옵션

**시작 시점 (tunnelStartTrigger)**:
| 값 | 설명 |
|----|------|
| `app_start` | 앱 시작 시 (Cloudflare 활성화 상태일 때) |
| `on_enable` | 설정에서 Cloudflare 토글 ON 시 |
| `on_upload` | 첫 파일 업로드 시 (지연 시작) |

**종료 시점 (tunnelStopTrigger)**:
| 값 | 설명 |
|----|------|
| `app_close` | 앱 종료 시 |
| `after_minutes` | 마지막 파일 업로드 후 N분 뒤 자동 종료 |
| `manual` | 수동으로만 종료 (설정 UI에서) |

---

## 에러 처리

### Startup 에러
| 시나리오 | 처리 |
|---------|------|
| 빈 프롬프트 목록 | 실행 건너뜀 |
| MCP 초기화 실패 | 콜백 실행 안됨 |
| 프롬프트 실행 중 에러 | stopOnError 설정에 따라 중단/계속 |
| 응답 타임아웃 | 30초 후 다음 프롬프트로 진행 |

### Upload 에러
| 시나리오 | 처리 |
|---------|------|
| cloudflared 바이너리 없음 | 다운로드 안내 다이얼로그 |
| 터널 시작 실패 | Toast 알림 + 재시도 버튼 |
| 네트워크 오류 | 로컬 업로드로 폴백 |
| URL 만료 | 자동 정리 (60분 후) |

---

## 핵심 파일 목록

### 참조할 기존 파일

| 파일 | 용도 |
|------|------|
| `src/views/Chat/index.tsx:893-921` | handleInitialMessage 함수 |
| `src/components/ChatInput.tsx` | 파일 업로드 UI, handleFiles 함수 |
| `electron/main/service.ts:28-30` | setServiceUpCallback |
| `folk/electron/web-bridge/proxyServer.ts` | 로컬 서버 패턴 |
| `src/views/Overlay/System.tsx` | 설정 UI 패턴 |

### 생성할 파일

**folk/shared/types/** (4개):
- `startup.ts`, `upload.ts`, `mcp.ts`, `index.ts`

**folk/electron/startup/** (4개):
- `store.ts`, `executor.ts`, `ipc.ts`, `index.ts`

**folk/electron/upload/** (7개):
- `fileServer.ts`, `tunnelManager.ts`, `urlTracker.ts`, `downloadManager.ts`, `store.ts`, `ipc.ts`, `index.ts`

**folk/electron/web-bridge/** (2개):
- `index.ts`, `types.ts`

**folk/ui/startup/** (8개):
- `atoms/startupState.ts`
- `components/StartupSettings.tsx`, `PromptList.tsx`, `PromptEditor.tsx`, `ExecutionProgress.tsx`
- `hooks/useStartupExecution.ts`
- `styles/_Startup.scss`
- `index.ts`

**folk/ui/upload/** (11개):
- `atoms/uploadManagerState.ts`
- `providers/index.ts`, `LocalProvider.ts`, `CloudflareProvider.ts`, `S3Provider.ts`
- `components/UploadSettings.tsx`, `UploadToggle.tsx`, `UploadProgress.tsx`, `DownloadProgress.tsx`
- `hooks/useUploadManager.ts`
- `styles/_Upload.scss`
- `index.ts`

**folk/bin/cloudflared/** (2개):
- `.gitkeep`, `README.md`

---

## 트레이드오프

### 장점
| 항목 | 설명 |
|------|------|
| **확장성** | Layer 분리 + Provider 패턴으로 향후 기능 추가 용이 |
| **Dive 독립성** | 75줄 수정으로 최소 영향 |
| **통합 효율** | 폴더 구조, 의존성, 테스트 1회 |
| **무료** | Cloudflare Quick Tunnel 무료 사용 |

### 단점
| 항목 | 완화 방안 |
|------|----------|
| 리팩토링 리스크 | Phase 1에서 충분한 검증 |
| cloudflared 바이너리 크기 | 첫 실행 시 다운로드 옵션 제공 |
| Quick Tunnel 8시간 제한 | 터널 재시작 로직 구현 |

### 의도와 다르게 구현될 수 있는 위험 요소

| 위험 요소 | 의도 | 잘못된 구현 가능성 | 방지책 |
|----------|------|-------------------|--------|
| **URL 만료 시점** | 프롬프트 전송 시점부터 60분 | URL 생성 시점부터 계산 | `urlExpiresAt`을 전송 시 갱신 |
| **파일 이중 저장** | 로컬 저장은 기존 Dive 로직 그대로 | 터널용 별도 복사본 생성 | fileServer가 기존 로컬 경로 직접 서빙 |
| **터널 종료 타이밍** | 설정에 따라 유연하게 | 항상 앱 종료 시에만 | tunnelStopTrigger 로직 철저히 구현 |
| **URL 삽입 위치** | 프롬프트 끝에 추가 | 커서 위치에 삽입 | 명시적으로 message 끝에 append |
| **다중 파일 순서** | 업로드 순서대로 | 비동기로 순서 뒤바뀜 | Promise.all 대신 순차 처리 |

---

## 최종 검증 체크리스트

### 계획 완결성

| 항목 | 상태 |
|------|------|
| 폴더 구조 정의 | ✅ |
| Startup 데이터 모델 | ✅ |
| Upload 데이터 모델 | ✅ |
| Provider 인터페이스 | ✅ |
| 프롬프트 주입 방식 | ✅ |
| Tunnel 관리 방식 | ✅ |
| **터널 생명주기 설정** | ✅ |
| URL 만료 관리 | ✅ |
| **URL 만료 시점 명확화** | ✅ (프롬프트 전송 시점) |
| **URL 삽입 포맷** | ✅ (각 파일 별도 줄) |
| IPC 정의 | ✅ |
| Import 경로 변경 목록 | ✅ |
| Dive 수정 포인트 | ✅ |
| 테스트 시나리오 | ✅ |
| **i18n 번역 키** | ✅ |
| **드래그앤드롭 구현** | ✅ |
| **순차 실행 로직** | ✅ |
| **설정 마이그레이션** | ✅ |
| **Linux 지원** | ✅ |

### 구현 후 확인사항

**Phase 1 완료 후**:
- [ ] `npm run check` 통과
- [ ] `npm run dev` 정상 실행
- [ ] 기존 기능 정상 (Audio, MCP, chrome-extension)

**Phase 2-4 완료 후**:
- [ ] Startup 설정 UI 동작
- [ ] Upload 설정 UI 동작
- [ ] Cloudflare Tunnel 시작/중지
- [ ] 파일 URL 생성 및 삽입

**Phase 5-6 완료 후**:
- [ ] `npm run package:windows` 성공
- [ ] `npm run package:darwin` 성공
- [ ] 패키징된 앱에서 모든 기능 정상

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
      "tunnelStatus": "Tunnel Status"
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

// 글로벌 navigate 접근
let globalNavigate: NavigateFunction | null = null
export const setNavigate = (nav: NavigateFunction) => { globalNavigate = nav }

// 응답 완료 대기 (isChatStreamingAtom 감시)
const waitForChatCompletion = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkStreaming = () => {
      const isStreaming = store.get(isChatStreamingAtom)
      if (!isStreaming) resolve()
      else setTimeout(checkStreaming, 100)
    }
    setTimeout(checkStreaming, 500)
  })
}

// 순차 실행
const executePrompts = async (prompts: StartupPrompt[]) => {
  for (const prompt of prompts.filter(p => p.enabled)) {
    updatePromptState(prompt.id, 'running')
    globalNavigate?.("/chat", { state: { initialMessage: prompt.prompt } })
    await waitForChatCompletion()
    await delay(prompt.executionDelay || 1000)
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
| 문서 버전 | 2.0.0 |
| 최종 수정 | 2026-01-23 |
| 프로젝트 | Axon (Dive Fork) |
| 대상 기능 | folk/ 리팩토링 + 자동 프롬프트 + Upload Manager |
| 이전 버전 | folk/backup/IMPLEMENTATION_PLAN_v1.md |
| cloudflared 배포 | 첫 실행 시 자동 다운로드 |
