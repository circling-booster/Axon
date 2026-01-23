# Startup Prompts UI

앱 시작 시 자동으로 LLM에 프롬프트를 전송하는 기능의 UI입니다.

## 구조

```
startup/
├── atoms/              # Jotai 상태 관리
│   └── startupState.ts
├── components/         # React 컴포넌트
│   ├── StartupSettings.tsx   # 메인 설정 UI
│   ├── PromptList.tsx        # 드래그앤드롭 목록
│   ├── PromptEditor.tsx      # 프롬프트 편집 모달
│   └── ExecutionProgress.tsx # 실행 진행 UI
├── hooks/              # Custom hooks
│   └── useStartupExecution.ts
├── styles/             # SCSS 스타일
│   └── _Startup.scss
└── index.ts            # 모듈 진입점
```

## 주요 기능

### 프롬프트 관리
- 프롬프트 추가/수정/삭제
- 드래그앤드롭으로 순서 변경 (@dnd-kit)
- 개별 프롬프트 활성화/비활성화

### 실행 모드
- 각 프롬프트는 **새 채팅**으로 실행됨
- 순차 실행 (이전 프롬프트 완료 후 다음 실행)
- `isChatStreamingAtom` 감시로 응답 완료 확인

## IPC 이벤트

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `axon:startup:getConfig` | UI → Main | 설정 조회 |
| `axon:startup:setConfig` | UI → Main | 설정 저장 |
| `axon:startup:ready` | Main → UI | 실행 준비 알림 |
| `axon:startup:execute` | UI → Main | 수동 실행 |
| `axon:startup:cancel` | UI → Main | 실행 취소 |

## 사용법

Settings > System 탭에서 설정할 수 있습니다.

```tsx
import { StartupSettings } from '@/folk/ui/startup'

// 설정 페이지에 추가
<StartupSettings />
```
