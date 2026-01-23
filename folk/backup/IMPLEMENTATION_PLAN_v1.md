# Axon 확장: folk/ 리팩토링 및 자동 프롬프트 기능

## 개요

Axon 레이어 아키텍처를 확립하고, 앱 시작 시 자동 프롬프트 실행 기능을 구현합니다.

**목표**:
1. folk/ 폴더를 Layer 기반으로 리팩토링 (UI/Electron 분리)
2. 앱 시작 시 자동으로 LLM에 프롬프트 전송하는 기능 구현
3. Dive 코드 수정 최소화 원칙 유지

---

## 핵심 결정사항

| 항목 | 결정 |
|------|------|
| 폴더 구조 | Layer 분리 (`folk/ui/`, `folk/electron/`, `folk/shared/`) |
| 프롬프트 주입 | 기존 `handleInitialMessage()` 활용 (Dive 수정 없음) |
| 설정 저장 | `.config/axon_startup.json` |
| 실행 타이밍 | MCP 서버 초기화 완료 후 (`setServiceUpCallback`) |
| UI 위치 | System 설정 탭 내 섹션으로 추가 |

---

## 폴더 구조 (리팩토링 후)

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
│   ├── startup/                     # [신규] 자동 프롬프트 UI
│   │   ├── atoms/startupState.ts
│   │   ├── components/
│   │   │   ├── StartupSettings.tsx
│   │   │   ├── PromptList.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   └── ExecutionProgress.tsx
│   │   ├── hooks/
│   │   ├── styles/_Startup.scss
│   │   └── index.ts
│   └── shared/                      # 공유 UI 컴포넌트
│
├── electron/                        # Electron (Main Process)
│   ├── mcp-servers/                 # 기존 mcp-servers 이동
│   │   └── playwright/
│   ├── startup/                     # [신규] 자동 프롬프트 백엔드
│   │   ├── store.ts
│   │   ├── executor.ts
│   │   ├── ipc.ts
│   │   └── index.ts
│   └── web-bridge/                  # [리팩토링] chrome-extension 연동
│       ├── proxyServer.ts           # 기존 proxyServer 이동
│       ├── types.ts                 # (향후) API 타입 정의
│       └── index.ts                 # 모듈 export
│
├── shared/                          # 양쪽 공유
│   ├── types/
│   │   ├── startup.ts
│   │   └── index.ts
│   └── constants/
│
└── backup/                          # 백업 파일
```

**구조 설명:**
- `folk/ui/` - React 컴포넌트, 훅, Jotai atoms
- `folk/electron/` - Electron main process 코드
- `folk/electron/web-bridge/` - chrome-extension 연동 (proxyServer, 향후 확장)
- `folk/shared/` - 양쪽에서 공유하는 타입, 상수

### web-bridge 폴더 분리 근거

**chrome-extension과의 관계:**
- `proxyServer.ts`는 포트 19999에서 실행되며, chrome-extension의 API 엔드포인트 역할
- chrome-extension → proxyServer (19999) → mcp-host (동적 포트) 구조

**분리 이유:**
| 요소 | 설명 |
|------|------|
| 긴밀한 결합 | chrome-extension과 1:1 연동 |
| 확장 가능성 | 인증, WebSocket, 미들웨어 추가 예상 |
| 일관성 | mcp-servers/, startup/과 동일한 서브폴더 패턴 |
| 명확성 | 단일 파일보다 역할이 명확히 드러남 |

**향후 확장 예시:**
```
folk/electron/web-bridge/
├── proxyServer.ts       # HTTP 프록시
├── wsServer.ts          # (향후) WebSocket 서버
├── auth.ts              # (향후) 인증 미들웨어
├── types.ts             # API 요청/응답 타입
└── index.ts
```

---

## 구현 상세

### 1. 데이터 모델 (TypeScript 타입)

```typescript
// folk/shared/types/startup.ts

/** 단일 자동 실행 프롬프트 */
export interface StartupPrompt {
  id: string                    // UUID
  name: string                  // 사용자 지정 이름
  prompt: string                // 실행할 프롬프트 내용
  enabled: boolean              // 활성화 여부
  order: number                 // 실행 순서
  createdAt: number
  updatedAt: number
  executionDelay?: number       // 실행 전 딜레이 (ms)
}

/** 자동 프롬프트 설정 전체 */
export interface StartupConfig {
  version: string
  enabled: boolean              // 전역 활성화 토글
  prompts: StartupPrompt[]
  settings: {
    runOnAppStart: boolean
    showProgressUI: boolean
    stopOnError: boolean
    defaultDelay: number        // 기본 1000ms
  }
}

/** 실행 상태 */
export type ExecutionStatus = 'idle' | 'waiting' | 'running' | 'completed' | 'error' | 'cancelled'

/** 전체 실행 상태 */
export interface StartupExecutionState {
  status: ExecutionStatus
  currentPromptIndex: number
  promptStates: { promptId: string; status: ExecutionStatus; error?: string }[]
  startedAt?: number
  completedAt?: number
}
```

---

### 2. 프롬프트 주입 방식 (핵심)

**기존 Dive 코드 활용** - `src/views/Chat/index.tsx` (893-921 라인):

```typescript
// 이미 구현된 handleInitialMessage 함수 활용
const handleInitialMessage = useCallback(async (message: string, files?: File[]) => {
  if (files && files.length > 0) {
    const fileList = new DataTransfer()
    files.forEach(file => fileList.items.add(file))
    await onSendMsg(message, fileList.files)
  } else {
    await onSendMsg(message)
  }
  // state 클리어...
}, [onSendMsg, navigate, location.pathname, chatId])

// location.state로 initialMessage 전달 시 자동 처리
useEffect(() => {
  const state = location.state as { initialMessage?: string, files?: File[] } | null
  if ((state?.initialMessage || state?.files) && !isInitialMessageHandled.current) {
    isInitialMessageHandled.current = true
    handleInitialMessage(state?.initialMessage || "", state?.files)
  }
}, [handleInitialMessage, chatId])
```

**자동 프롬프트 실행 방식**:
```typescript
// folk/ui/startup/hooks/useStartupExecution.ts
const executePrompt = async (prompt: StartupPrompt) => {
  // React Router navigate를 사용하여 프롬프트 주입
  navigate("/chat", {
    state: { initialMessage: prompt.prompt },
    replace: false
  })
}
```

**장점**: Dive 채팅 시스템을 전혀 수정하지 않음

### 2.1 순차 실행 상세 로직

**응답 완료 대기 메커니즘**:
```typescript
// folk/ui/startup/hooks/useStartupExecution.ts

const executePrompts = async (prompts: StartupPrompt[]) => {
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]
    if (!prompt.enabled) continue

    // 1. 상태 업데이트
    updatePromptState(prompt.id, 'running')

    // 2. 프롬프트 실행
    navigate("/chat", { state: { initialMessage: prompt.prompt } })

    // 3. 응답 완료 대기 (isChatStreamingAtom 감시)
    await waitForChatCompletion()

    // 4. 딜레이 대기
    await delay(prompt.executionDelay || settings.defaultDelay)

    // 5. 상태 업데이트
    updatePromptState(prompt.id, 'completed')
  }
}

// 응답 완료 대기 함수
const waitForChatCompletion = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkStreaming = () => {
      const isStreaming = store.get(isChatStreamingAtom)
      if (!isStreaming) {
        resolve()
      } else {
        setTimeout(checkStreaming, 100)  // 100ms 간격으로 체크
      }
    }
    // 초기 딜레이 후 체크 시작 (메시지 전송 시간 확보)
    setTimeout(checkStreaming, 500)
  })
}
```

**React Router navigate 접근 방식**:
```typescript
// folk/ui/startup/index.ts
import { NavigateFunction } from 'react-router-dom'

let globalNavigate: NavigateFunction | null = null

export const setNavigate = (nav: NavigateFunction) => {
  globalNavigate = nav
}

export const getNavigate = () => globalNavigate

// Layout.tsx에서 등록
import { useNavigate } from 'react-router-dom'
import { setNavigate } from '../../../folk/ui/startup'

const Layout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])
  // ...
}
```

---

### 3. 실행 타이밍 및 흐름

**MCP 서버 초기화 완료 후 실행** - `electron/main/service.ts` (28-30 라인):

```typescript
// 기존 Dive 코드
const onServiceUpCallbacks: ((ip: string, port: number) => Promise<void>)[] = []
export const setServiceUpCallback = (callback: (ip: string, port: number) => Promise<void>) =>
  onServiceUpCallbacks.push(callback)
```

**자동 프롬프트 실행 흐름**:
```
[앱 시작]
    ↓
[initMCPClient()] → initApp() → registerDefaultMcpServers() → startHostService()
    ↓
[MCP Host Ready] → onServiceUpCallbacks 실행
    ↓
[setupStartupCallback()] → IPC: 'axon:startup:ready'
    ↓
[Renderer] Layout.tsx에서 IPC 수신
    ↓
[startupConfig.enabled === true?]
    ↓
[ExecutionProgress UI 표시]
    ↓
[각 프롬프트 순차 실행] → navigate("/chat", { state: { initialMessage } })
    ↓
[완료]
```

---

### 4. 설정 파일

**위치**: `.config/axon_startup.json`

```json
{
  "version": "1.0.0",
  "enabled": true,
  "prompts": [
    {
      "id": "uuid-1",
      "name": "브라우저 열기",
      "prompt": "크롬 브라우저를 열어줘",
      "enabled": true,
      "order": 0,
      "createdAt": 1706000000000,
      "updatedAt": 1706000000000,
      "executionDelay": 1000
    }
  ],
  "settings": {
    "runOnAppStart": true,
    "showProgressUI": true,
    "stopOnError": false,
    "defaultDelay": 1000
  }
}
```

---

## 구현 순서

### 사전 준비: 의존성 설치

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

### Phase 1: 리팩토링 (folk/ 구조 변경)

**백업**: `folk/backup/refactor/`에 현재 구조 백업

1. **폴더 구조 생성**
   - `folk/ui/` 디렉토리 생성
   - `folk/electron/` 디렉토리 생성
   - `folk/shared/types/` 디렉토리 생성

2. **파일 이동**
   - `folk/audio/` → `folk/ui/audio/`
   - `folk/mcp-servers/` → `folk/electron/mcp-servers/`
   - `folk/proxyServer.ts` → `folk/electron/web-bridge/proxyServer.ts`

3. **web-bridge 모듈 생성**
   - `folk/electron/web-bridge/index.ts` 생성 (proxyServer export)
   - `folk/electron/web-bridge/types.ts` 생성 (향후 확장용 빈 파일)

4. **Import 경로 수정**
   | 파일 | 변경 |
   |------|------|
   | `src/views/Chat/index.tsx` | `../../../folk/audio` → `../../../folk/ui/audio` |
   | `src/styles/index.scss` | `../../folk/audio/styles` → `../../folk/ui/audio/styles` |
   | `electron/main/index.ts` | `../../folk/proxyServer` → `../../folk/electron/web-bridge` |
   | `electron/main/service.ts` | `../../folk/mcp-servers` → `../../folk/electron/mcp-servers` |
   | `electron/main/ipc/axon.ts` | `../../../folk/mcp-servers/types` → `../../../folk/shared/types` |

5. **공유 타입 분리**
   - `folk/electron/mcp-servers/types.ts` 공통 타입 → `folk/shared/types/mcp.ts` 이동

### Phase 2: 자동 프롬프트 백엔드

**신규 파일만 생성**

1. **타입 정의**
   - `folk/shared/types/startup.ts` - StartupConfig, StartupPrompt 등

2. **Electron Store**
   - `folk/electron/startup/store.ts` - axon_startup.json 관리

3. **IPC 핸들러**
   - `folk/electron/startup/ipc.ts`
     - `axon:startup:getConfig` - 설정 조회
     - `axon:startup:setConfig` - 설정 저장
     - `axon:startup:ready` - 실행 준비 완료 신호

4. **실행 로직**
   - `folk/electron/startup/executor.ts`
     - `setupStartupCallback()` - setServiceUpCallback 등록

5. **모듈 통합**
   - `folk/electron/startup/index.ts`
   - `electron/main/ipc/axon.ts` 수정 - startup IPC 등록
   - `electron/main/service.ts` 수정 - setupStartupCallback 호출

### Phase 3: 자동 프롬프트 UI

1. **Jotai Atoms**
   - `folk/ui/startup/atoms/startupState.ts`
     - `startupConfigAtom` (atomWithStorage)
     - `executionStateAtom`
     - Action atoms (add, remove, reorder, execute)

2. **컴포넌트**
   - `folk/ui/startup/components/StartupSettings.tsx` - 메인 설정 UI
   - `folk/ui/startup/components/PromptList.tsx` - 프롬프트 목록 (드래그앤드롭)
   - `folk/ui/startup/components/PromptEditor.tsx` - 프롬프트 편집 모달
   - `folk/ui/startup/components/ExecutionProgress.tsx` - 실행 진행 UI

3. **스타일**
   - `folk/ui/startup/styles/_Startup.scss`
   - `src/styles/index.scss`에 import 추가

4. **훅**
   - `folk/ui/startup/hooks/useStartupExecution.ts` - 실행 로직

5. **Dive 통합** (최소 수정)
   - `src/views/Layout.tsx` - IPC 리스너 추가 (5줄)
   - `src/views/Overlay/System.tsx` - StartupSettings 섹션 추가 (10줄)

### Phase 4: 테스트 및 검증

1. **타입 검사**: `npm run check`
2. **개발 테스트**: `npm run dev`
3. **기능 테스트**:
   - 설정 저장/로드
   - 프롬프트 CRUD
   - 앱 시작 시 자동 실행
   - 실행 취소
4. **패키징 테스트**: `npm run package:windows`

---

## Dive 수정 포인트 (최소화)

### 수정 파일 목록

| 파일 | 변경 내용 | 라인 수 |
|------|----------|--------|
| `electron/main/service.ts` | setupStartupCallback 호출 추가 | +3 |
| `electron/main/ipc/axon.ts` | startup IPC 핸들러 등록 | +5 |
| `src/views/Layout.tsx` | IPC 리스너 추가 | +10 |
| `src/views/Overlay/System.tsx` | StartupSettings 컴포넌트 추가 | +15 |
| `src/styles/index.scss` | Startup 스타일 import | +1 |

**총 수정량**: 약 35줄 (모든 로직은 folk/ 내부)

### Layout.tsx 수정 예시

```typescript
// [AXON] 자동 프롬프트 실행 리스너
useEffect(() => {
  const handleStartupReady = () => {
    import('../../../folk/ui/startup').then(({ triggerStartupExecution }) => {
      triggerStartupExecution()
    })
  }
  window.ipcRenderer?.on('axon:startup:ready', handleStartupReady)
  return () => {
    window.ipcRenderer?.off('axon:startup:ready', handleStartupReady)
  }
}, [])
```

---

## 에러 처리

| 시나리오 | 처리 |
|---------|------|
| 빈 프롬프트 목록 | 실행 건너뜀 |
| 전역 비활성화 | 실행 건너뜀 |
| MCP 초기화 실패 | 콜백 실행 안됨 (안전) |
| 프롬프트 실행 중 에러 | `stopOnError` 설정에 따라 중단/계속 |
| 설정 파일 손상 | 기본값으로 재생성 |
| 응답 타임아웃 | 30초 후 다음 프롬프트로 진행 (설정 가능) |

### 에러 복구 UI

```typescript
// ExecutionProgress.tsx에 재시도 버튼 포함
interface PromptExecutionState {
  promptId: string
  status: ExecutionStatus
  error?: string
  retryCount: number  // 재시도 횟수 추적
}

// 실패한 프롬프트 재시도
const retryFailedPrompt = async (promptId: string) => {
  const prompt = prompts.find(p => p.id === promptId)
  if (prompt) {
    await executePrompt(prompt)
  }
}
```

---

## 추가 구현 상세

### 드래그앤드롭 라이브러리

**선정**: `@dnd-kit/core` + `@dnd-kit/sortable`

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

**이유**:
- React 18 완벽 호환
- 가벼움 (번들 크기 작음)
- 접근성(a11y) 내장
- TypeScript 지원

```typescript
// folk/ui/startup/components/PromptList.tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

const PromptList = () => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      reorderPrompts(
        prompts.findIndex(p => p.id === active.id),
        prompts.findIndex(p => p.id === over?.id)
      )
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

### 다국어 지원 (i18n)

**추가할 번역 키** (`src/locales/en.json`, `ko.json` 등):

```json
{
  "startup": {
    "title": "Startup Prompts",
    "description": "Prompts that run automatically when the app starts",
    "enabled": "Enable startup prompts",
    "addPrompt": "Add Prompt",
    "editPrompt": "Edit Prompt",
    "deletePrompt": "Delete Prompt",
    "promptName": "Prompt Name",
    "promptContent": "Prompt Content",
    "executionDelay": "Delay before execution (ms)",
    "settings": {
      "runOnAppStart": "Run on app start",
      "showProgressUI": "Show progress UI",
      "stopOnError": "Stop on error"
    },
    "execution": {
      "running": "Running startup prompts...",
      "completed": "Startup prompts completed",
      "cancelled": "Startup prompts cancelled",
      "error": "Error executing prompt"
    }
  }
}
```

### 설정 마이그레이션

```typescript
// folk/electron/startup/store.ts

const CURRENT_VERSION = '1.0.0'

interface MigrationFn {
  version: string
  migrate: (config: any) => StartupConfig
}

const migrations: MigrationFn[] = [
  // 향후 버전 업그레이드 시 추가
  // {
  //   version: '1.1.0',
  //   migrate: (config) => ({ ...config, newField: defaultValue })
  // }
]

export const loadConfig = (): StartupConfig => {
  const raw = store.get('startup', DEFAULT_STARTUP_CONFIG)

  // 버전 체크 및 마이그레이션
  if (raw.version !== CURRENT_VERSION) {
    const migrated = applyMigrations(raw)
    store.set('startup', migrated)
    return migrated
  }

  return raw
}

const applyMigrations = (config: any): StartupConfig => {
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

## 전후 변경사항 분석

### 폴더 구조 변경

| 변경 전 | 변경 후 |
|---------|---------|
| `folk/audio/` | `folk/ui/audio/` |
| `folk/mcp-servers/` | `folk/electron/mcp-servers/` |
| `folk/proxyServer.ts` | `folk/electron/web-bridge/proxyServer.ts` |
| (없음) | `folk/electron/web-bridge/` (신규 폴더) |
| (없음) | `folk/shared/types/` |
| (없음) | `folk/ui/startup/` |
| (없음) | `folk/electron/startup/` |

### Import 경로 변경

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| `src/views/Chat/index.tsx` | `../../../folk/audio` | `../../../folk/ui/audio` |
| `src/styles/index.scss` | `../../folk/audio/styles` | `../../folk/ui/audio/styles` |
| `electron/main/index.ts` | `../../folk/proxyServer` | `../../folk/electron/web-bridge` |
| `electron/main/service.ts` | `../../folk/mcp-servers` | `../../folk/electron/mcp-servers` |
| `electron/main/ipc/axon.ts` | `../../../folk/mcp-servers/types` | `../../../folk/shared/types` |

### 앱 시작 흐름 변경

**변경 전**:
```
앱 시작 → initMCPClient() → MCP 서버 초기화 → 완료 → 사용자 대기
```

**변경 후**:
```
앱 시작 → initMCPClient() → MCP 서버 초기화 → 완료
    ↓
[startupConfig.enabled?]
    ↓ YES
[ExecutionProgress UI 표시]
    ↓
[프롬프트 순차 실행]
    ↓
[완료 → 사용자 대기]
```

### 설정 파일 변경

| 변경 전 | 변경 후 |
|---------|---------|
| `.config/mcp_config.json` | (변경 없음) |
| `.config/model_config.json` | (변경 없음) |
| (없음) | `.config/axon_startup.json` (신규) |

### UI 변경

| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| Settings > System | 기존 설정만 | + "Startup Prompts" 섹션 |
| 앱 시작 시 | 즉시 채팅 화면 | 자동 프롬프트 실행 시 진행 UI 표시 |

---

## 트레이드오프 분석

### 장점

| 항목 | 설명 |
|------|------|
| **확장성** | Layer 분리로 향후 기능 추가 용이 |
| **Dive 독립성** | 총 35줄 수정으로 Dive 코드 영향 최소화 |
| **재사용성** | 기존 `handleInitialMessage()` 활용으로 중복 제거 |
| **유지보수성** | 모듈화된 구조로 개별 기능 테스트/수정 용이 |
| **사용자 제어** | 설정 기반으로 기능 on/off 가능 |

### 단점

| 항목 | 설명 | 완화 방안 |
|------|------|----------|
| **리팩토링 리스크** | 기존 import 경로 전체 수정 필요 | Phase 1에서 충분한 테스트 |
| **복잡성 증가** | 순차 실행 로직이 복잡 | 명확한 상태 관리와 로깅 |
| **초기 개발 시간** | 구조 설계에 시간 소요 | 장기적 유지보수 비용 절감 |
| **의존성 추가** | @dnd-kit 패키지 추가 | 작은 번들 크기, 필수 기능 |
| **설정 파일 관리** | 새 설정 파일 추가 | 마이그레이션 로직으로 호환성 보장 |

### 대안 비교

| 접근법 | 장점 | 단점 | 채택 여부 |
|--------|------|------|----------|
| **API 직접 호출** | 간단함 | 인증/세션 관리 복잡 | ❌ |
| **handleInitialMessage 활용** | Dive 수정 없음 | navigate 접근 필요 | ✅ 채택 |
| **새 채팅 시스템 구현** | 완전한 제어 | 중복 코드, 유지보수 부담 | ❌ |

---

## 핵심 파일 목록

### 참조할 기존 파일 (패턴 확인용)

| 파일 | 용도 |
|------|------|
| `src/views/Chat/index.tsx:893-921` | handleInitialMessage 함수, 프롬프트 주입 방식 |
| `electron/main/service.ts:28-30` | setServiceUpCallback 함수, 콜백 등록 방식 |
| `folk/audio/atoms/audioState.ts` | Jotai atomWithStorage 패턴 |
| `src/views/Overlay/System.tsx` | 설정 UI 패턴 |
| `src/atoms/toastState.ts` | Toast 알림 패턴 |

### 생성할 파일 (신규)

**folk/shared/types/** (2개):
- `startup.ts` - StartupConfig, StartupPrompt 타입
- `index.ts` - 타입 export

**folk/electron/startup/** (4개):
- `store.ts` - electron-store 설정 관리
- `executor.ts` - 실행 콜백 등록
- `ipc.ts` - IPC 핸들러
- `index.ts` - 모듈 export

**folk/electron/web-bridge/** (2개, 리팩토링):
- `index.ts` - startLocalServer export
- `types.ts` - API 요청/응답 타입 (향후 확장용)

**folk/ui/startup/** (8개):
- `atoms/startupState.ts` - Jotai atoms
- `components/StartupSettings.tsx` - 설정 UI
- `components/PromptList.tsx` - 프롬프트 목록
- `components/PromptEditor.tsx` - 편집 모달
- `components/ExecutionProgress.tsx` - 실행 진행 UI
- `hooks/useStartupExecution.ts` - 실행 훅
- `styles/_Startup.scss` - 스타일
- `index.ts` - 모듈 export

---

## 검증 방법

### 1. 리팩토링 검증
```bash
npm run check   # TypeScript 타입 검사
npm run dev     # 개발 서버 실행
# 기존 기능 정상 동작 확인 (Audio Mixer, Playwright MCP)
```

### 2. 자동 프롬프트 기능 검증

**설정 UI 테스트**:
1. Axon 앱 실행
2. Settings > System 탭 열기
3. "Startup Prompts" 섹션 확인
4. 프롬프트 추가/편집/삭제/순서변경 테스트

**자동 실행 테스트**:
1. 프롬프트 추가: "안녕하세요"
2. 전역 활성화 ON
3. 앱 재시작
4. 자동으로 "안녕하세요" 메시지 전송 확인
5. ExecutionProgress UI 표시 확인

**비활성화 테스트**:
1. 전역 활성화 OFF
2. 앱 재시작
3. 자동 실행 안됨 확인

### 3. 패키징 테스트
```bash
npm run package:windows
# exe 실행 후 위 테스트 반복
```

---

## 최종 폴더 구조

```
folk/
├── ui/                              # React (Renderer)
│   ├── audio/                       # 기존 audio (이동)
│   │   ├── atoms/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── index.ts
│   └── startup/                     # [신규] 자동 프롬프트 UI
│       ├── atoms/startupState.ts
│       ├── components/
│       ├── hooks/
│       ├── styles/_Startup.scss
│       └── index.ts
│
├── electron/                        # Electron (Main)
│   ├── mcp-servers/                 # 기존 mcp-servers (이동)
│   │   └── playwright/
│   ├── startup/                     # [신규] 자동 프롬프트 백엔드
│   │   ├── store.ts
│   │   ├── executor.ts
│   │   ├── ipc.ts
│   │   └── index.ts
│   └── web-bridge/                  # chrome-extension 연동 (리팩토링)
│       ├── proxyServer.ts           # 기존 proxyServer (이동)
│       ├── types.ts                 # API 타입 정의
│       └── index.ts                 # 모듈 export
│
├── shared/                          # 양쪽 공유
│   └── types/
│       ├── startup.ts
│       ├── mcp.ts
│       └── index.ts
│
└── backup/                          # 백업 파일
    └── refactor/
```

### chrome-extension 연동 구조

```
[루트]/chrome-extension/           # Chrome 확장 프로그램 (별도 배포)
├── manifest.json                  # Chrome Extension Manifest V3
├── content.js                     # 웹페이지 주입 스크립트
└── README.md

    ↓ HTTP API 호출 (localhost:19999)

folk/electron/web-bridge/          # Electron Main Process
├── proxyServer.ts                 # 프록시 서버 (포트 19999)
├── types.ts                       # API 타입 정의
└── index.ts

    ↓ 내부 포워딩 (동적 포트)

mcp-host/                          # Python MCP Host (내부)
```

---

## 최종 검증 체크리스트

### 계획 완결성 검증

| 항목 | 상태 | 비고 |
|------|------|------|
| 폴더 구조 정의 | ✅ | ui/electron/shared 레이어 분리 |
| 데이터 모델 정의 | ✅ | StartupPrompt, StartupConfig 타입 |
| 프롬프트 주입 방식 | ✅ | handleInitialMessage() 활용 |
| 순차 실행 로직 | ✅ | isChatStreamingAtom 감시 |
| navigate 접근 방식 | ✅ | 글로벌 export 패턴 |
| 실행 타이밍 | ✅ | setServiceUpCallback 사용 |
| 설정 저장/로드 | ✅ | axon_startup.json |
| 에러 처리 | ✅ | stopOnError, 재시도, 타임아웃 |
| 드래그앤드롭 | ✅ | @dnd-kit 선정 |
| i18n 지원 | ✅ | 번역 키 정의 |
| 설정 마이그레이션 | ✅ | 버전 기반 마이그레이션 |
| web-bridge 분리 | ✅ | chrome-extension 연동 고려 |
| Import 경로 정리 | ✅ | 전체 변경 목록 작성 |
| Dive 수정 최소화 | ✅ | 약 35줄 수정 |
| 테스트 시나리오 | ✅ | 기능별 테스트 케이스 |

### 잠재적 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| Import 경로 변경 누락 | 높음 | TypeScript check로 사전 검증 |
| isChatStreamingAtom 접근 문제 | 중간 | Jotai store 직접 접근 방식 사용 |
| 순차 실행 중 앱 종료 | 낮음 | 상태 저장하지 않음 (의도적) |
| chrome-extension 호환성 | 낮음 | API 변경 없음 (포트 유지) |

### 구현 후 확인사항

1. **리팩토링 완료 후**
   - [ ] `npm run check` 통과
   - [ ] `npm run dev` 정상 실행
   - [ ] Audio Mixer 기능 정상
   - [ ] Playwright MCP 정상

2. **자동 프롬프트 기능 완료 후**
   - [ ] Settings > System에 UI 표시
   - [ ] 프롬프트 CRUD 동작
   - [ ] 드래그앤드롭 순서 변경
   - [ ] 앱 재시작 시 자동 실행
   - [ ] 실행 취소 동작
   - [ ] chrome-extension 정상 연동

3. **패키징 후**
   - [ ] `npm run package:windows` 성공
   - [ ] 설치 파일에서 모든 기능 동작

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0.0 |
| 최종 수정 | 2026-01-23 |
| 작성자 | Claude (Plan Mode) |
| 프로젝트 | Axon (Dive Fork) |
| 대상 기능 | folk/ 리팩토링 + 자동 프롬프트 실행 |
