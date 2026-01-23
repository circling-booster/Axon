# CDP (Chrome DevTools Protocol) 디버깅 가이드

Axon/Electron 앱을 CDP를 통해 런타임 디버깅하기 위한 종합 가이드입니다.

---

## 목차

1. [무엇(What) - CDP란?](#1-무엇what---cdp란)
2. [왜(Why) - CDP를 사용하는 이유](#2-왜why---cdp를-사용하는-이유)
3. [언제(When) - CDP 사용 시점](#3-언제when---cdp-사용-시점)
4. [어디서(Where) - 연결 정보](#4-어디서where---연결-정보)
5. [누가(Who) - 대상](#5-누가who---대상)
6. [어떻게(How) - 사용 방법](#6-어떻게how---사용-방법)
7. [예제 스크립트](#7-예제-스크립트)
8. [트러블슈팅](#8-트러블슈팅)
9. [참고 자료](#9-참고-자료)

---

## 1. 무엇(What) - CDP란?

**Chrome DevTools Protocol (CDP)**는 Chrome, Chromium 기반 브라우저 및 Electron 앱을 프로그래밍 방식으로 제어하고 디버깅할 수 있는 프로토콜입니다.

### 주요 기능
- **Runtime**: JavaScript 실행 및 평가
- **Console**: 콘솔 메시지 수집
- **DOM**: DOM 트리 탐색 및 조작
- **Network**: 네트워크 요청 모니터링
- **Page**: 페이지 네비게이션 제어
- **Profiler**: 성능 프로파일링

### Electron에서의 CDP
Electron 앱은 Chromium 기반이므로 CDP를 통해:
- Renderer Process (React 앱)에 접근
- JavaScript 코드 실행
- 상태 검사 및 디버깅

---

## 2. 왜(Why) - CDP를 사용하는 이유

### DevTools만으로 부족한 경우

| 상황 | DevTools | CDP |
|------|----------|-----|
| 수동 디버깅 | ✅ | ✅ |
| 자동화된 테스트 | ❌ | ✅ |
| 반복적인 상태 검사 | ❌ | ✅ |
| 스크립트 기반 진단 | ❌ | ✅ |
| CI/CD 통합 | ❌ | ✅ |
| 원격 디버깅 | 제한적 | ✅ |

### CDP 사용이 효과적인 경우
- **무한 루프/렌더링 문제**: React 상태 변화 추적
- **IPC 통신 문제**: Main-Renderer 간 통신 검증
- **상태 관리 문제**: Jotai/Redux 상태 검사
- **자동화된 진단**: 반복 가능한 디버깅 스크립트

---

## 3. 언제(When) - CDP 사용 시점

### 즉시 사용해야 하는 경우
1. **무한 재렌더링**: `Maximum update depth exceeded` 에러
2. **IPC 핸들러 누락**: `No handler registered for 'xxx'` 에러
3. **상태 동기화 문제**: UI와 데이터 불일치
4. **메모리 누수 의심**: 성능 저하 발생

### 진단 시나리오별 사용
```
문제 발생 → DevTools Console 확인 → 원인 불명확
                                        ↓
                                   CDP 스크립트로 상세 진단
                                        ↓
                                   IPC 호출 검증
                                        ↓
                                   상태 값 추적
                                        ↓
                                   원인 파악 → 수정
```

---

## 4. 어디서(Where) - 연결 정보

### 기본 설정 (Axon)

| 항목 | 값 | 설명 |
|------|-----|------|
| CDP 포트 | `9222` | `electron/main/index.ts`에서 설정 |
| Dev Server | `http://localhost:5173` | Vite 개발 서버 |
| WebSocket | `ws://localhost:9222/devtools/page/{id}` | 페이지별 WebSocket |

### CDP 활성화 코드 (이미 적용됨)
```typescript
// electron/main/index.ts
if (process.env.NODE_ENV !== 'production') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
}
```

### 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| `http://localhost:9222/json` | 활성 페이지 목록 |
| `http://localhost:9222/json/version` | 브라우저/Electron 버전 정보 |
| `http://localhost:9222/json/protocol` | CDP 프로토콜 스펙 |

---

## 5. 누가(Who) - 대상

### 사용자
- **개발자**: 기능 구현 중 디버깅
- **QA 엔지니어**: 자동화된 테스트 스크립트 작성
- **DevOps**: CI/CD 파이프라인에서 앱 상태 검증

### 필요 지식
- JavaScript/TypeScript 기본
- Electron IPC 개념
- React/Jotai 상태 관리 이해
- 터미널/명령줄 사용

---

## 6. 어떻게(How) - 사용 방법

### Step 1: 앱 실행
```bash
npm run dev
```

### Step 2: 페이지 목록 확인
```bash
curl http://localhost:9222/json
```

**응답 예시:**
```json
[{
  "id": "82DF58AAC66C55826B2939617D42BB5E",
  "title": "New Chat - Dive AI",
  "url": "http://localhost:5173/#/chat/xxx",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/page/82DF58..."
}]
```

### Step 3: WebSocket 연결
Node.js에서 `ws` 모듈 사용:
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:9222/devtools/page/{id}');
```

### Step 4: CDP 명령 전송

#### Runtime 활성화
```javascript
ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
```

#### JavaScript 실행
```javascript
ws.send(JSON.stringify({
  id: 2,
  method: 'Runtime.evaluate',
  params: {
    expression: `window.location.href`,
    returnByValue: true
  }
}));
```

#### IPC 호출 테스트
```javascript
ws.send(JSON.stringify({
  id: 3,
  method: 'Runtime.evaluate',
  params: {
    expression: `
      (async () => {
        try {
          const result = await window.ipcRenderer.invoke('axon:upload:getConfig');
          return JSON.stringify(result, null, 2);
        } catch (e) {
          return 'Error: ' + e.message;
        }
      })()
    `,
    awaitPromise: true
  }
}));
```

### Step 5: 응답 처리
```javascript
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.id === 3 && msg.result) {
    console.log('IPC Result:', msg.result.result.value);
  }
});
```

---

## 7. 예제 스크립트

### 기본 디버깅 스크립트
`scripts/cdp-debug.cjs` 파일 참조

### IPC 핸들러 전체 테스트
```javascript
/**
 * 모든 Axon IPC 핸들러 테스트
 */
const http = require('http');
const WebSocket = require('ws');

const IPC_CHANNELS = [
  'axon:upload:getConfig',
  'axon:upload:getFiles',
  'axon:upload:getTunnelStatus',
  'axon:startup:getConfig',
  'axon:startup:getEnabledPrompts'
];

http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const pages = JSON.parse(data);
    const mainPage = pages.find(p => p.url.includes('localhost:5173'));
    if (!mainPage) return console.log('Page not found');

    const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      IPC_CHANNELS.forEach((channel, index) => {
        setTimeout(() => {
          console.log(`\nTesting: ${channel}`);
          ws.send(JSON.stringify({
            id: 100 + index,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (async () => {
                  try {
                    const result = await window.ipcRenderer.invoke('${channel}');
                    return JSON.stringify(result, null, 2);
                  } catch (e) {
                    return 'Error: ' + e.message;
                  }
                })()
              `,
              awaitPromise: true
            }
          }));
        }, (index + 1) * 500);
      });
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id >= 100) {
        const channel = IPC_CHANNELS[msg.id - 100];
        console.log(`[${channel}]:`, msg.result?.result?.value || 'No result');
      }
    });

    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, (IPC_CHANNELS.length + 2) * 500);
  });
});
```

### 콘솔 로그 실시간 수집
```javascript
ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  // 콘솔 메시지 캡처
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = msg.params.args.map(a => a.value || a.description).join(' ');
    console.log(`[${msg.params.type}]`, args);
  }

  // 에러 캡처
  if (msg.method === 'Runtime.exceptionThrown') {
    console.error('[Exception]', msg.params.exceptionDetails);
  }
});
```

---

## 8. 트러블슈팅

### 연결 실패

**증상:** `curl http://localhost:9222/json` 응답 없음

**해결:**
1. 앱이 실행 중인지 확인: `npm run dev`
2. 개발 모드인지 확인 (production에서는 CDP 비활성화)
3. 포트 충돌 확인: `netstat -an | grep 9222`

### 페이지를 찾을 수 없음

**증상:** `Main page not found`

**해결:**
1. 페이지 URL 패턴 확인: `localhost:5173` 또는 `localhost:7777`
2. DevTools 페이지 제외 필터 추가

### IPC 핸들러 없음 에러

**증상:** `No handler registered for 'xxx'`

**원인:**
- IPC 핸들러 미등록
- 채널 이름 불일치

**진단:**
```javascript
// 등록된 모든 IPC 채널 확인 (Main Process 로그 확인)
console.log('[Axon IPC] All handlers registered')
```

### 비동기 결과 미반환

**증상:** `Runtime.evaluate` 결과가 `undefined`

**해결:**
- `awaitPromise: true` 옵션 사용
- Promise를 반환하는 표현식으로 래핑

```javascript
{
  method: 'Runtime.evaluate',
  params: {
    expression: `(async () => { /* ... */ })()`,
    awaitPromise: true  // 중요!
  }
}
```

---

## 9. 참고 자료

### 공식 문서
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Electron Debugging](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)

### 프로젝트 내 파일
| 파일 | 설명 |
|------|------|
| `electron/main/index.ts:5-8` | CDP 포트 설정 |
| `scripts/cdp-debug.cjs` | CDP 디버깅 스크립트 |
| `.vscode/launch.json` | VS Code 디버거 설정 |

### 주요 CDP 도메인 참조

| 도메인 | 주요 메서드 | 용도 |
|--------|-------------|------|
| Runtime | `enable`, `evaluate`, `callFunctionOn` | JS 실행 |
| Console | `enable`, `clear` | 콘솔 메시지 |
| DOM | `getDocument`, `querySelector` | DOM 탐색 |
| Page | `navigate`, `reload` | 페이지 제어 |
| Network | `enable`, `getResponseBody` | 네트워크 모니터링 |
| Profiler | `enable`, `start`, `stop` | 성능 분석 |

---

## 부록: Axon IPC 채널 목록

### Startup Prompts
| 채널 | 설명 |
|------|------|
| `axon:startup:getConfig` | 설정 조회 |
| `axon:startup:setConfig` | 설정 저장 |
| `axon:startup:addPrompt` | 프롬프트 추가 |
| `axon:startup:updatePrompt` | 프롬프트 수정 |
| `axon:startup:deletePrompt` | 프롬프트 삭제 |
| `axon:startup:reorderPrompts` | 순서 변경 |
| `axon:startup:getEnabledPrompts` | 활성 프롬프트 조회 |
| `axon:startup:execute` | 수동 실행 |

### Upload Manager
| 채널 | 설명 |
|------|------|
| `axon:upload:getConfig` | 설정 조회 |
| `axon:upload:setConfig` | 설정 저장 |
| `axon:upload:startTunnel` | 터널 시작 |
| `axon:upload:stopTunnel` | 터널 중지 |
| `axon:upload:getTunnelStatus` | 터널 상태 |
| `axon:upload:registerFile` | 파일 등록 |
| `axon:upload:unregisterFile` | 파일 해제 |
| `axon:upload:getFiles` | 파일 목록 |
| `axon:upload:cleanupExpired` | 만료 파일 정리 |
| `axon:upload:checkBinary` | 바이너리 확인 |
| `axon:upload:downloadBinary` | 바이너리 다운로드 |

---

*최종 업데이트: 2026-01-23*
