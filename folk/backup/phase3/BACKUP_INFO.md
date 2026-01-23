# Phase 3 백업 정보

## 백업 일시
2026-01-23

## 백업 이유
Axon Playwright MCP 통합을 위한 기존 파일 백업

## 백업된 파일

| 원본 파일 | 백업 파일 |
|----------|----------|
| `electron/main/service.ts` | `service.ts.bak` |
| `electron/main/ipc/index.ts` | `ipc-index.ts.bak` |
| `src/views/Layout.tsx` | `Layout.tsx.bak` |

## 복원 방법

### 개별 파일 복원
```bash
# service.ts 복원
cp folk/backup/phase3/service.ts.bak electron/main/service.ts

# ipc/index.ts 복원
cp folk/backup/phase3/ipc-index.ts.bak electron/main/ipc/index.ts

# Layout.tsx 복원
cp folk/backup/phase3/Layout.tsx.bak src/views/Layout.tsx
```

### 전체 롤백
1. 위의 모든 파일 복원
2. `.config/mcp_config.json`에서 `__AXON_PLAYWRIGHT_MCP__` 항목 삭제
3. (선택) `.config/playwright-mcp/` 폴더 및 `playwright-mcp-config.json` 삭제

## 변경 내용 요약

### service.ts
- `initApp()` 후 `registerDefaultMcpServers()` 호출 추가

### ipc/index.ts
- `ipcAxonHandler()` import 및 호출 추가

### Layout.tsx
- `axon:user-action-required` IPC 이벤트 리스너 추가
- Toast 알림 표시 로직 추가

## 관련 문서
- [계획 파일](C:\Users\sungb\.claude\plans\cuddly-drifting-narwhal.md)
- [folk/mcp-servers/README.md](../../mcp-servers/README.md)
