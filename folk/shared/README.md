# folk/shared/ - 공유 타입 및 상수

Renderer Process와 Main Process 양쪽에서 공유하는 타입과 상수를 정의합니다.

## 구조

```
shared/
├── types/          # TypeScript 타입 정의
│   ├── startup.ts  # Startup 관련 타입
│   ├── upload.ts   # Upload 관련 타입
│   ├── mcp.ts      # MCP 관련 타입
│   └── index.ts    # 통합 export
│
└── constants/      # 상수 정의
    ├── cloudflared.ts  # cloudflared 관련 상수
    └── index.ts        # 통합 export
```

## 사용법

### 타입 import

```typescript
import { StartupConfig, StartupPrompt } from '@/folk/shared/types'
import { UploadConfig, UploadedFile } from '@/folk/shared/types'
```

### 상수 import

```typescript
import { CLOUDFLARED_VERSION, CLOUDFLARED_URLS } from '@/folk/shared/constants'
```

## 타입 예시

### Startup 타입
```typescript
interface StartupPrompt {
  id: string
  name: string
  prompt: string
  enabled: boolean
  order: number
}
```

### Upload 타입
```typescript
interface UploadedFile {
  id: string
  originalName: string
  externalUrl?: string
  urlExpiresAt?: number
}
```
