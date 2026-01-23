# folk/ - Axon 확장 레이어

Dive 기반 Axon의 커스텀 기능을 담는 레이어입니다.

## 구조

```
folk/
├── ui/              # React 컴포넌트 (Renderer Process)
│   ├── audio/       # Audio Mixer 기능
│   ├── startup/     # 자동 프롬프트 실행 UI
│   ├── upload/      # Upload Manager UI
│   └── shared/      # 공유 UI 컴포넌트
│
├── electron/        # Electron 백엔드 (Main Process)
│   ├── mcp-servers/ # MCP 서버 관리
│   ├── startup/     # 자동 프롬프트 백엔드
│   ├── upload/      # Upload Manager 백엔드
│   └── web-bridge/  # Chrome Extension 연동
│
├── shared/          # 양쪽에서 공유하는 타입/상수
│   ├── types/       # TypeScript 타입 정의
│   └── constants/   # 상수 정의
│
└── bin/             # 외부 바이너리
    └── cloudflared/ # Cloudflare Tunnel 바이너리
```

## 기능

### Audio Mixer
오디오 파일 재생 관리 기능입니다. 채팅에서 생성된 오디오 URL을 감지하고 재생합니다.

### Startup Prompts
앱 시작 시 자동으로 프롬프트를 LLM에 전송하는 기능입니다.
- 여러 프롬프트를 순차적으로 실행
- 각 프롬프트는 새 채팅으로 실행됨
- 드래그앤드롭으로 순서 변경 가능

### Upload Manager
Cloudflare Quick Tunnel을 통해 로컬 파일을 외부에서 접근 가능하게 만드는 기능입니다.
- 로컬 파일 서버 + Cloudflare Tunnel
- 동적 포트 할당으로 충돌 방지
- URL 자동 만료 (60분)

## 설계 원칙

1. **Dive 코드 수정 최소화**: 모든 로직은 folk/ 내에서 완결
2. **명확한 레이어 분리**: UI/Electron/Shared 분리
3. **IPC 통신**: Renderer-Main 간 `axon:*` 네임스페이스 사용

## 설정 파일

- `.config/axon_startup.json` - 자동 프롬프트 설정
- `.config/axon_upload.json` - Upload Manager 설정
