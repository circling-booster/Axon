# Upload 백엔드

Cloudflare Tunnel을 통한 파일 공유 기능의 백엔드입니다.

## 구조

```
upload/
├── fileServer.ts       # Express 로컬 파일 서버
├── tunnelManager.ts    # cloudflared 프로세스 관리
├── downloadManager.ts  # cloudflared 자동 다운로드
├── urlTracker.ts       # URL 만료 관리
├── store.ts            # 설정 파일 관리 (axon_upload.json)
├── ipc.ts              # IPC 핸들러
└── index.ts            # 모듈 진입점
```

## 핵심 컴포넌트

### FileServer
Express 기반 로컬 파일 서버입니다.

- **동적 포트 할당**: `listen(0)`으로 OS가 사용 가능한 포트 자동 할당
- **파일 서빙**: `GET /files/:id` - 등록된 파일 제공
- **만료 체크**: 전송 시점부터 60분 후 자동 만료

### TunnelManager
cloudflared 프로세스를 관리합니다.

- **Quick Tunnel**: 인증 없이 임시 URL 발급
- **8시간 제한**: 7시간 50분 후 자동 재시작
- **재시작 알림**: URL 변경 시 Toast 알림

### DownloadManager
cloudflared 바이너리를 자동으로 다운로드합니다.

- **고정 버전**: 2024.11.1 (안정성 보장)
- **진행률 콜백**: UI에 다운로드 진행률 표시
- **플랫폼 지원**: Windows, macOS, Linux

## 설정 파일

`.config/axon_upload.json`:

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
    "tunnelStopTrigger": "app_close"
  },
  "s3": {
    "enabled": false
  }
}
```

## IPC 핸들러

| 핸들러 | 설명 |
|--------|------|
| `axon:upload:startTunnel` | 터널 시작, URL 반환 |
| `axon:upload:stopTunnel` | 터널 중지 |
| `axon:upload:registerFile` | 파일 서버에 등록 |
| `axon:upload:markAsSent` | 전송 완료, 만료 시간 설정 |
| `axon:upload:checkBinary` | cloudflared 존재 확인 |
| `axon:upload:downloadBinary` | cloudflared 다운로드 |

## Cleanup

앱 종료 시 반드시 `uploadCleanup()`을 호출해야 합니다.

```typescript
import { uploadCleanup } from './folk/electron/upload'

// 앱 종료 시
await uploadCleanup()
```
