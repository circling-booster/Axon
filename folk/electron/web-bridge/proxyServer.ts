import { createServer, IncomingMessage, ServerResponse, request as httpRequest, RequestOptions } from 'node:http';
import { BrowserWindow } from 'electron';
// [수정] electron/main 폴더의 모듈을 참조 (folk/electron/web-bridge에서)
import { serviceStatus } from '../../../electron/main/service';

const PORT = 19999;

/**
 * 외부 요청을 내부 Python 서버(mcp-host)로 전달하는 프록시 서버
 */
export function startLocalServer(win: BrowserWindow) {
  const server = createServer((clientReq: IncomingMessage, clientRes: ServerResponse) => {
    // 1. CORS 설정
    clientRes.setHeader('Access-Control-Allow-Origin', '*');
    clientRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    clientRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Preflight 요청 처리
    if (clientReq.method === 'OPTIONS') {
      clientRes.writeHead(200);
      clientRes.end();
      return;
    }

    // 2. 내부 백엔드 서비스 상태 확인
    if (!serviceStatus.port || !serviceStatus.ip) {
      const errorMsg = JSON.stringify({
        success: false,
        error: "Internal backend service is not ready yet.",
        status: "initializing"
      });
      clientRes.writeHead(503, { 'Content-Type': 'application/json' });
      clientRes.end(errorMsg);
      return;
    }

    // 3. 내부 Python 서버로 요청 전달 준비
    const options: RequestOptions = {
      hostname: serviceStatus.ip,
      port: serviceStatus.port,
      path: clientReq.url,
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        host: `${serviceStatus.ip}:${serviceStatus.port}`
      }
    };

    // 4. 프록시 요청 실행
    const proxyReq = httpRequest(options, (proxyRes) => {
      // 4-1. 응답 헤더 전달
      clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      // 4-2. 데이터 파이핑 (SSE 등 스트리밍 지원)
      proxyRes.pipe(clientRes, { end: true });
    });

    // 5. 에러 핸들링
    proxyReq.on('error', (err) => {
      console.error(`[Proxy Error] ${clientReq.method} ${clientReq.url}:`, err.message);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ success: false, error: "Bad Gateway: Failed to connect to internal backend." }));
      }
    });

    // 6. 데이터 변경 감지 -> UI 새로고침 이벤트 발송
    proxyReq.on('response', (proxyRes) => {
      if (clientReq.method !== 'GET' && clientReq.method !== 'HEAD') {
        if (proxyRes.statusCode && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
          if (!win.isDestroyed()) {
            // [중요] 기존 Dive UI가 이 이벤트를 수신하도록 설정되어 있어야 함 (preload script 수정 필요시 folk에서 관리 권장)
            // 현재는 기존 로직 유지를 위해 이벤트만 발송
            win.webContents.send('refresh');
            console.log(`[Proxy] Triggered UI refresh for ${clientReq.method} request.`);
          }
        }
      }
    });

    // 7. 요청 데이터 파이핑
    clientReq.pipe(proxyReq, { end: true });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dive API Proxy Server running on port ${PORT}`);
    console.log(`Target Internal Backend: ${serviceStatus.ip}:${serviceStatus.port}`);
  });

  return server;
}
