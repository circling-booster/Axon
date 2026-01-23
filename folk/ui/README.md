# folk/ui/ - UI 레이어

Renderer Process에서 실행되는 React 컴포넌트들입니다.

## 구조

```
ui/
├── audio/       # Audio Mixer 기능
├── startup/     # 자동 프롬프트 실행 UI
├── upload/      # Upload Manager UI
└── shared/      # 공유 UI 컴포넌트
```

## 모듈별 역할

### audio/
- 오디오 URL 감지 및 재생
- Jotai 상태 관리
- 재생 컨트롤 UI

### startup/
- 프롬프트 목록 관리 UI
- 드래그앤드롭 순서 변경
- 실행 진행 상태 표시

### upload/
- Cloudflare Tunnel 설정 UI
- 파일 업로드 토글
- 다운로드 진행률 표시

## IPC 통신

Electron Main Process와 IPC를 통해 통신합니다.

```typescript
// 예시: Startup 설정 가져오기
window.ipcRenderer.invoke('axon:startup:getConfig')

// 예시: 터널 시작
window.ipcRenderer.invoke('axon:upload:startTunnel')
```

## 스타일

각 모듈의 `styles/` 폴더에 SCSS 파일이 있습니다.
`src/styles/index.scss`에서 import됩니다.
