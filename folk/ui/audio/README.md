# Axon Audio Mixer

LLM 응답에서 오디오 URL을 자동 감지하여 다중 트랙 믹서 UI를 제공하는 Axon 전용 기능입니다.

## 기능

- **오디오 URL 자동 감지**: LLM 응답에서 오디오 파일 링크 자동 탐지
- **다중 트랙 동시 재생**: 트랙 분리(stem separation) 시 여러 트랙 동시 재생 지원
- **개별 트랙 컨트롤**: 각 트랙별 볼륨 조절, 뮤트(M), 솔로(S) 기능
- **마스터 컨트롤**: 전체 재생/정지/리셋, 마스터 볼륨
- **MCP 도구별 설정**: MCP 도구별로 자동 재생 활성화/비활성화 설정
- **플로팅 UI**: 화면 우하단 고정 위치, 최소화/닫기 지원

## 파일 구조

```
folk/audio/
├── index.ts                    # 모듈 export
├── README.md                   # 이 문서
│
├── components/
│   ├── AudioMixer.tsx          # 메인 믹서 UI 컴포넌트
│   ├── AudioTrack.tsx          # 개별 트랙 컴포넌트
│   ├── MasterControls.tsx      # 마스터 컨트롤 컴포넌트
│   └── AudioWatcher.tsx        # 메시지 감시 컴포넌트
│
├── hooks/
│   ├── useAudioMixer.ts        # 믹서 상태 관리 훅
│   └── useAudioDetector.ts     # 오디오 URL 감지 훅
│
├── atoms/
│   └── audioState.ts           # Jotai atoms (상태 관리)
│
├── utils/
│   └── audioUrlParser.ts       # URL 파싱 유틸리티
│
└── styles/
    └── _AudioMixer.scss        # 스타일
```

## 지원 오디오 형식

- `.wav`
- `.mp3`
- `.ogg`
- `.flac`
- `.m4a`
- `.aac`
- `.webm`

## 자동 라벨 감지

URL이나 링크 텍스트에서 다음 키워드를 감지하여 자동으로 라벨을 부여합니다:

| 라벨 | 키워드 |
|------|--------|
| Drums | drum, drums, 드럼, percussion |
| Vocals | vocal, vocals, 보컬, 목소리, voice, singing |
| Bass | bass, 베이스, bassline |
| Other | other, 기타, 나머지, accompaniment, inst, instrumental, 반주 |
| Piano | piano, 피아노, keys, keyboard |
| Guitar | guitar, 기타악기, acoustic, electric |

## 사용법

### 기본 사용

AudioMixer와 AudioWatcher는 이미 Chat 컴포넌트에 통합되어 있습니다:

- `AudioWatcher`: 메시지를 감시하고 오디오 URL 발견 시 세션 생성
- `AudioMixer`: 우하단에 플로팅 믹서 UI 표시

### MCP 도구 자동 재생 설정

자동 재생은 기본적으로 비활성화되어 있습니다. MCP 도구별로 활성화하려면:

```typescript
import { useSetAtom } from "jotai"
import { setMcpToolSettingAtom } from "../folk/audio"

// 컴포넌트 내에서
const setMcpToolSetting = useSetAtom(setMcpToolSettingAtom)

// demucs 도구에 대해 자동 재생 활성화
setMcpToolSetting({
  mcpToolName: "demucs",
  setting: {
    autoPlayEnabled: true,
    defaultVolume: 0.8
  }
})
```

### 프로그래매틱 사용

```typescript
import { useAudioMixer } from "../folk/audio"

function MyComponent() {
  const {
    session,
    playAll,
    pauseAll,
    stopAll,
    resetAll,
    setTrackVolume,
    toggleTrackMute,
    toggleTrackSolo,
    setMasterVolume,
    closeSession
  } = useAudioMixer()

  // 세션이 있으면 재생
  if (session) {
    playAll()
  }
}
```

### 수동으로 오디오 세션 생성

```typescript
import { useSetAtom } from "jotai"
import { createAudioSessionAtom } from "../folk/audio"

const createSession = useSetAtom(createAudioSessionAtom)

createSession({
  chatId: "chat-123",
  messageId: "msg-456",
  mcpToolName: "demucs",
  tracks: [
    {
      id: "track-1",
      url: "https://example.com/drums.wav",
      label: "Drums",
      messageId: "msg-456",
      chatId: "chat-123",
      volume: 0.8,
      isMuted: false,
      isSolo: false,
      isLoaded: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    }
  ],
  isPlaying: false,
  masterVolume: 1,
  isMinimized: false
})
```

## 키보드 단축키

믹서가 활성화되어 있을 때:

- `Space`: 재생/일시정지 토글
- `Escape`: 믹서 닫기

## 상태 구조

### AudioTrack

```typescript
interface AudioTrack {
  id: string
  url: string
  label: string         // drums, vocals, bass, other 등
  messageId: string
  chatId: string
  volume: number        // 0-1
  isMuted: boolean
  isSolo: boolean
  isLoaded: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  error: string | null
}
```

### AudioMixerSession

```typescript
interface AudioMixerSession {
  sessionId: string
  chatId: string
  messageId: string
  mcpToolName: string   // 어떤 MCP 도구의 응답인지
  tracks: AudioTrack[]
  isPlaying: boolean
  masterVolume: number
  isMinimized: boolean
  createdAt: number
}
```

### AudioSettings (localStorage에 저장)

```typescript
interface AudioSettings {
  globalAutoPlayEnabled: boolean
  defaultVolume: number
  mcpToolSettings: Record<string, {
    autoPlayEnabled: boolean
    defaultVolume: number
  }>
}
```

## 기존 코드 수정 내역

### 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/views/Chat/index.tsx` | AudioWatcher import 및 사용 |
| `src/views/Chat/ChatMessages.tsx` | AudioMixer import 및 사용 |
| `src/styles/index.scss` | AudioMixer 스타일 import |

### 백업

수정 전 파일들은 `folk/backup/` 폴더에 백업되어 있습니다:

- `folk/backup/ChatMessages.tsx.bak`
- `folk/backup/Message.tsx.bak`
- `folk/backup/index.scss.bak`
- `folk/backup/BACKUP_INFO.md`

## 테마 지원

다크/라이트 테마 모두 지원합니다. CSS 변수를 통해 테마 색상이 자동으로 적용됩니다.

## 주의사항

1. **브라우저 자동 재생 정책**: 브라우저 정책에 따라 사용자 상호작용 후에만 오디오 재생이 가능합니다.
2. **메모리 관리**: 채팅 변경 시 이전 오디오 세션이 자동으로 정리됩니다.
3. **CORS**: 외부 오디오 URL의 경우 CORS 설정이 필요할 수 있습니다.

## 향후 개선 계획

- [ ] MCP 설정 UI에 오디오 설정 패널 추가
- [ ] 웨이브폼 시각화
- [ ] 이퀄라이저/이펙트
- [ ] 세션 히스토리 UI
- [ ] 키보드 단축키 커스터마이징
