# folk/electron/ - Electron 레이어

Main Process에서 실행되는 Electron 백엔드 코드입니다.

## 구조

```
electron/
├── mcp-servers/    # MCP 서버 관리
├── startup/        # 자동 프롬프트 백엔드
├── upload/         # Upload Manager 백엔드
└── web-bridge/     # Chrome Extension 연동
```

## 모듈별 역할

### mcp-servers/
- MCP 서버 등록 및 관리
- Playwright MCP 서버 포함

### startup/
- 설정 파일 관리 (axon_startup.json)
- 프롬프트 실행 로직
- IPC 핸들러

### upload/
- 로컬 파일 서버 (Express)
- Cloudflare Tunnel 관리
- cloudflared 바이너리 다운로드
- URL 만료 관리

### web-bridge/
- Chrome Extension과의 통신
- 프록시 서버 관리

## IPC 핸들러 등록

모든 IPC 핸들러는 `electron/main/ipc/axon.ts`에서 등록됩니다.

```typescript
// electron/main/ipc/axon.ts
import { registerStartupIPC } from '../../folk/electron/startup'
import { registerUploadIPC } from '../../folk/electron/upload'

export function registerAxonIPC() {
  registerStartupIPC()
  registerUploadIPC()
}
```

## Cleanup

앱 종료 시 각 모듈의 cleanup 함수가 호출됩니다.

```typescript
// electron/main/service.ts
import { uploadCleanup } from '../../folk/electron/upload'

export async function cleanup() {
  await uploadCleanup()
  // ...
}
```
