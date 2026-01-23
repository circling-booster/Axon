# Axon Playwright MCP

LLM 기반 브라우저 자동화를 위한 Playwright MCP 서버 자동 설정 모듈입니다.

## 개요

이 모듈은 Axon 앱 시작 시 Playwright MCP 서버를 자동으로 설정합니다.

- **브라우저**: 시스템에 설치된 Chrome 또는 Edge 사용
- **스크립트 주입**: 봇 감지 우회 스크립트 자동 설정
- **자동 등록**: mcp_config.json에 자동 등록

## 구조

```
folk/mcp-servers/playwright/
├── index.ts                  # 모듈 export
├── setup.ts                  # 메인 설정 로직
├── types.ts                  # TypeScript 타입
├── README.md                 # 이 문서
├── config/
│   └── defaultConfig.ts      # 기본 설정 및 스크립트
└── utils/
    ├── chromeDetector.ts     # Chrome/Edge 설치 감지
    └── configManager.ts      # 설정 파일 관리
```

## 생성되는 파일

앱 실행 시 다음 파일들이 자동으로 생성됩니다:

### 개발 모드 (.config/)
```
.config/
├── playwright-mcp-config.json    # Playwright MCP 설정
└── playwright-mcp/
    ├── initScript.js             # 브라우저 주입 스크립트
    └── initPage.ts               # Page 초기화 스크립트
```

### 프로덕션 (~/.dive/config/)
```
~/.dive/config/
├── playwright-mcp-config.json
└── playwright-mcp/
    ├── initScript.js
    └── initPage.ts
```

## 봇 감지 우회

`initScript.js`에 포함된 봇 감지 우회 기능:

| 항목 | 설명 |
|------|------|
| `navigator.webdriver` | `undefined`로 숨김 |
| `window.chrome` | Chrome 객체 정상화 |
| `navigator.plugins` | 플러그인 배열 시뮬레이션 |
| `navigator.languages` | 한국어 우선 설정 |
| `navigator.permissions` | API 정상화 |
| WebGL parameters | 하드웨어 정보 시뮬레이션 |

## 사용자 정의

### 스크립트 수정

생성된 스크립트 파일을 직접 수정할 수 있습니다:

```javascript
// .config/playwright-mcp/initScript.js
// 브라우저 컨텍스트에서 실행되는 JavaScript

// 사용자 정의 코드 추가
window.myCustomFunction = () => {
  console.log('Custom function');
};
```

```typescript
// .config/playwright-mcp/initPage.ts
// Playwright Page 객체 설정

export default async ({ page }) => {
  // 사용자 정의 설정 추가
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9'
  });
};
```

### 설정 파일 수정

```json
// .config/playwright-mcp-config.json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "channel": "chrome",
      "headless": false
    }
  },
  "initScript": [".config/playwright-mcp/initScript.js"],
  "initPage": [".config/playwright-mcp/initPage.ts"]
}
```

## 브라우저 지원

| 브라우저 | 지원 | 설명 |
|---------|------|------|
| Chrome | ✅ | 기본 권장 |
| Edge | ✅ | Chrome 미설치 시 대체 |
| Firefox | ❌ | 미지원 |
| Safari | ❌ | 미지원 |

## 에러 처리

### Chrome 미설치

Chrome과 Edge 모두 설치되어 있지 않으면:
- UI에 Toast 알림 표시
- Playwright MCP 등록 건너뜀
- 다른 MCP 서버는 정상 동작

### 권한 오류

설정 파일 생성 실패 시:
- 에러 로그 출력
- 등록 건너뜀

## mcp_config.json 등록 항목

```json
{
  "mcpServers": {
    "__AXON_PLAYWRIGHT_MCP__": {
      "transport": "stdio",
      "enabled": true,
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--config", "C:/Users/.../playwright-mcp-config.json"
      ]
    }
  }
}
```

## 로깅

```
[Axon Playwright] Starting setup...
[Axon Playwright] Browser detected: chrome at C:\...\chrome.exe
[Axon Playwright] Created .config/playwright-mcp/initScript.js
[Axon Playwright] Created .config/playwright-mcp/initPage.ts
[Axon Playwright] Created .config/playwright-mcp-config.json
[Axon Playwright] Setup completed successfully
```

## 관련 문서

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [@playwright/mcp npm](https://www.npmjs.com/package/@playwright/mcp)
- [folk/mcp-servers/README.md](../README.md)

## 플랫폼 지원

- **Windows**: ✅ 지원
- **macOS**: 🚧 추후 지원 예정
- **Linux**: 🚧 추후 지원 예정
