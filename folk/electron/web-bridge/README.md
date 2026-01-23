# Web Bridge

Chrome Extension과의 통신을 담당하는 모듈입니다.

## 구조

```
web-bridge/
├── proxyServer.ts  # 프록시 서버 (기존 folk/proxyServer.ts에서 이동)
├── types.ts        # API 타입 정의
└── index.ts        # 모듈 진입점
```

## 역할

Chrome Extension에서 Axon 데스크톱 앱으로 데이터를 전달하기 위한 브릿지 역할을 합니다.

## 사용법

```typescript
import { startProxyServer, stopProxyServer } from './folk/electron/web-bridge'

// 서버 시작
await startProxyServer(port)

// 서버 중지
await stopProxyServer()
```

## 향후 확장

- API 타입 정의 추가
- 인증 메커니즘 추가
- WebSocket 지원
