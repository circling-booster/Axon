# Startup 백엔드

앱 시작 시 자동 프롬프트 실행을 관리하는 백엔드입니다.

## 구조

```
startup/
├── store.ts      # 설정 파일 관리 (axon_startup.json)
├── executor.ts   # 프롬프트 실행 로직
├── ipc.ts        # IPC 핸들러
└── index.ts      # 모듈 진입점
```

## 설정 파일

`.config/axon_startup.json`:

```json
{
  "version": "1.0.0",
  "enabled": true,
  "prompts": [
    {
      "id": "uuid",
      "name": "Morning Greeting",
      "prompt": "Good morning! What's on the agenda today?",
      "enabled": true,
      "order": 0,
      "createdAt": 1706000000000,
      "updatedAt": 1706000000000
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

## 실행 흐름

1. MCP 서버 초기화 완료 (`setServiceUpCallback` 콜백)
2. `axon_startup.json` 설정 확인
3. `axon:startup:ready` IPC 이벤트 발생
4. UI에서 순차적으로 프롬프트 실행

## IPC 핸들러

| 핸들러 | 설명 |
|--------|------|
| `axon:startup:getConfig` | 설정 조회 |
| `axon:startup:setConfig` | 설정 저장 |
| `axon:startup:execute` | 수동 실행 트리거 |
| `axon:startup:cancel` | 실행 취소 |

## 사용법

```typescript
import { setupStartupCallback, registerStartupIPC } from './folk/electron/startup'

// IPC 핸들러 등록
registerStartupIPC()

// MCP 서버 준비 후 실행 콜백 등록
setupStartupCallback()
```
