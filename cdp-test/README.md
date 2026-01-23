# Axon 앱 CDP 제어 가이드

## 개요
Chrome DevTools Protocol (CDP)을 사용하여 Axon Electron 앱을 프로그래밍 방식으로 제어하는 방법입니다.

## 설정 방법

### 1. CDP 활성화 코드 추가
`electron/main/index.ts` 파일 상단에 다음 코드 추가:

```typescript
import { app, BrowserWindow, shell, ipcMain } from "electron"
import path from "node:path"
import os from "node:os"

// [CDP] 원격 디버깅 포트 활성화 (개발 모드에서만)
if (process.env.NODE_ENV !== 'production') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
}
```

### 2. 앱 실행
```bash
npm run dev
```

### 3. CDP 연결 확인
```bash
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

## 사용 방법

### puppeteer-core로 연결
```javascript
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.connect({
  browserURL: 'http://127.0.0.1:9222',
  defaultViewport: null
});

const pages = await browser.pages();
const axonPage = pages.find(p => p.url().includes('localhost:5173'));

// 페이지 조작
await axonPage.evaluate(() => {
  // DOM 조작 코드
});

await browser.disconnect();
```

### 주요 CDP 엔드포인트
- `http://127.0.0.1:9222/json/version` - 브라우저 버전 정보
- `http://127.0.0.1:9222/json/list` - 열린 페이지 목록
- `ws://127.0.0.1:9222/devtools/page/{id}` - 페이지별 WebSocket 연결

## 필요한 패키지
```bash
npm install puppeteer-core --save-dev
```

## 주의사항
- CDP 포트 9222는 개발 모드에서만 활성화됨
- 프로덕션 빌드에서는 비활성화됨
- 보안상 로컬에서만 접근 가능
