# Axon MCP Servers

Axon 앱 시작 시 자동으로 등록되는 기본 MCP 서버 관리 시스템입니다.

## 개요

이 모듈은 Dive의 MCP 서버 시스템 위에 Axon 전용 기본 MCP 서버를 자동으로 등록하는 기능을 제공합니다.

## 구조

```
folk/mcp-servers/
├── index.ts              # 메인 모듈 (registerDefaultMcpServers)
├── registry.ts           # 기본 MCP 서버 목록
├── types.ts              # TypeScript 타입 정의
├── README.md             # 이 문서
│
└── playwright/           # Playwright MCP 모듈
    ├── index.ts
    ├── setup.ts
    ├── types.ts
    ├── README.md
    ├── config/
    ├── scripts/
    └── utils/
```

## 사용법

### 앱 시작 시 자동 등록

`electron/main/service.ts`에서 자동으로 호출됩니다:

```typescript
// service.ts의 initMCPClient() 함수 내
await initApp().catch(console.error)

// [AXON] 기본 MCP 서버 등록
const { registerDefaultMcpServers } = await import('../../folk/mcp-servers')
await registerDefaultMcpServers(win).catch(console.error)

await installHostDependencies(win).catch(console.error)
```

### 새 MCP 서버 추가

1. `folk/mcp-servers/새서버/` 폴더 생성
2. `setup.ts` 파일에 `setup()` 함수 구현
3. `registry.ts`에 서버 항목 추가

```typescript
// registry.ts
export const defaultMcpServers: DefaultMcpServer[] = [
  // 기존 서버들...
  {
    name: '__AXON_NEW_SERVER_MCP__',
    displayName: 'New Server',
    description: '새 MCP 서버 설명',
    setup: async (context) => {
      const { setup } = await import('./new-server')
      return setup(context)
    },
    enabled: true
  }
]
```

## 타입

### SetupResult

```typescript
interface SetupResult {
  success: boolean
  mcpEntry?: McpServerEntry    // 성공 시 mcp_config.json에 추가할 항목
  error?: string               // 실패 시 에러 메시지
  requiresUserAction?: {       // UI 알림 필요 시
    type: string
    message: string
  }
}
```

### SetupContext

```typescript
interface SetupContext {
  configDir: string           // 설정 디렉토리 경로
  isDev: boolean              // 개발 모드 여부
  win?: BrowserWindow         // IPC 알림용 윈도우
}
```

## 플랫폼 지원

- **Windows**: ✅ 지원
- **macOS**: 🚧 추후 지원 예정
- **Linux**: 🚧 추후 지원 예정

## 포함된 MCP 서버

### Playwright MCP

- **이름**: `__AXON_PLAYWRIGHT_MCP__`
- **기능**: LLM 기반 브라우저 자동화
- **요구사항**: Google Chrome 설치
- **상세**: [playwright/README.md](./playwright/README.md)

## 에러 처리

### Chrome 미설치
- Toast 알림으로 사용자에게 Chrome 설치 필요 안내
- Playwright MCP는 등록되지 않음 (다른 MCP 서버는 정상 동작)

### 기존 수동 등록
- Playwright MCP가 이미 수동으로 등록되어 있으면 자동 등록 건너뜀
- 로그: `[Axon MCP] Playwright already registered manually, skipping auto-registration`

## 로깅

모든 로그는 `[Axon MCP]` 접두사를 사용합니다:

```
[Axon MCP] Starting default MCP servers registration...
[Axon MCP] Found 1 enabled server(s) for current platform
[Axon MCP] Setting up "Playwright Browser"...
[Axon MCP] Server "__AXON_PLAYWRIGHT_MCP__" added to mcp_config.json
[Axon MCP] "Playwright Browser" setup completed
[Axon MCP] Default MCP servers registration completed
```

## 관련 파일

- `electron/main/service.ts` - 호출 위치
- `electron/main/ipc/axon.ts` - IPC 핸들러
- `src/views/Layout.tsx` - UI 알림 수신
- `.config/mcp_config.json` - MCP 서버 설정 파일
