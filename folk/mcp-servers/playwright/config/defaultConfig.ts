/**
 * Axon Playwright MCP - 기본 설정 및 스크립트
 *
 * 기본 initScript.js 및 initPage.ts 내용
 */

/**
 * Playwright MCP 패키지 버전
 * 'latest'는 항상 최신, 특정 버전은 '@playwright/mcp@x.x.x' 형식
 */
export const PLAYWRIGHT_MCP_VERSION = '@playwright/mcp@latest'

/**
 * MCP 서버 이름 (mcp_config.json 키)
 */
export const PLAYWRIGHT_MCP_SERVER_NAME = '__AXON_PLAYWRIGHT_MCP__'

/**
 * 기본 initScript.js 내용
 *
 * 브라우저 컨텍스트에서 실행되는 JavaScript
 * 봇 감지 우회 및 브라우저 환경 설정
 */
export const DEFAULT_INIT_SCRIPT = `/**
 * Axon Playwright MCP - Browser Init Script
 *
 * 이 스크립트는 모든 페이지 로드 전에 브라우저 컨텍스트에서 실행됩니다.
 * 봇 감지 우회 및 브라우저 환경을 설정합니다.
 *
 * 사용자 정의가 필요하면 이 파일을 직접 수정하세요.
 * 수정된 내용은 앱 재시작 후 적용됩니다.
 */

// ============================================
// 1. navigator.webdriver 숨김 (봇 감지 우회)
// ============================================
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined,
  configurable: true
});

// ============================================
// 2. Chrome 객체 정상화
// ============================================
if (!window.chrome) {
  window.chrome = {};
}
window.chrome.runtime = window.chrome.runtime || {};

// ============================================
// 3. permissions API 정상화
// ============================================
const originalQuery = navigator.permissions.query.bind(navigator.permissions);
navigator.permissions.query = async (parameters) => {
  if (parameters.name === 'notifications') {
    return Promise.resolve({ state: Notification.permission, onchange: null });
  }
  return originalQuery(parameters);
};

// ============================================
// 4. plugins 배열 정상화 (봇 감지 우회)
// ============================================
Object.defineProperty(navigator, 'plugins', {
  get: () => {
    // 일반적인 브라우저 플러그인 시뮬레이션
    return [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', filename: 'internal-nacl-plugin' }
    ];
  },
  configurable: true
});

// ============================================
// 5. languages 설정
// ============================================
Object.defineProperty(navigator, 'languages', {
  get: () => ['ko-KR', 'ko', 'en-US', 'en'],
  configurable: true
});

// ============================================
// 6. hardwareConcurrency 정상화
// ============================================
Object.defineProperty(navigator, 'hardwareConcurrency', {
  get: () => 4, // 일반적인 값
  configurable: true
});

// ============================================
// 7. deviceMemory 정상화
// ============================================
Object.defineProperty(navigator, 'deviceMemory', {
  get: () => 8, // 8GB
  configurable: true
});

// ============================================
// 8. WebGL 정상화 (고급 봇 감지 우회)
// ============================================
const getParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(parameter) {
  // UNMASKED_VENDOR_WEBGL
  if (parameter === 37445) {
    return 'Google Inc. (Intel)';
  }
  // UNMASKED_RENDERER_WEBGL
  if (parameter === 37446) {
    return 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)';
  }
  return getParameter.call(this, parameter);
};

// ============================================
// Axon 마커 (디버깅용)
// ============================================
window.__AXON_PLAYWRIGHT_INJECTED__ = true;
window.__AXON_INJECT_TIME__ = Date.now();

console.log('[Axon] Browser init script loaded');
`

/**
 * 기본 initPage.ts 내용
 *
 * Playwright Page 객체에서 실행되는 TypeScript
 * 페이지 레벨 설정
 */
export const DEFAULT_INIT_PAGE = `/**
 * Axon Playwright MCP - Page Initialization Script
 *
 * 이 스크립트는 Playwright MCP 서버에서 실행되며,
 * Page 객체를 통해 페이지 레벨 설정을 수행합니다.
 *
 * 사용자 정의가 필요하면 이 파일을 직접 수정하세요.
 * 수정된 내용은 앱 재시작 후 적용됩니다.
 */

export default async ({ page }: { page: any }) => {
  // ============================================
  // 1. 기본 viewport 설정
  // ============================================
  await page.setViewportSize({ width: 1920, height: 1080 });

  // ============================================
  // 2. 콘솔 로그 수집 (디버깅용)
  // ============================================
  page.on('console', (msg: any) => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      console.error(\`[Page Error] \${text}\`);
    } else if (type === 'warning') {
      console.warn(\`[Page Warning] \${text}\`);
    }
    // info, log 등은 너무 많아서 생략
  });

  // ============================================
  // 3. 페이지 에러 수집
  // ============================================
  page.on('pageerror', (error: Error) => {
    console.error('[Page Exception]', error.message);
  });

  // ============================================
  // 4. 요청 실패 로깅 (선택적)
  // ============================================
  // page.on('requestfailed', (request: any) => {
  //   console.warn(\`[Request Failed] \${request.url()}\`);
  // });

  console.log('[Axon] Page initialized');
};
`
