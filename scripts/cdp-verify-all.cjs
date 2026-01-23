/**
 * CDP Verify All - Startup & Upload 기능 종합 검증
 */

const http = require('http');
const WebSocket = require('ws');

http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const pages = JSON.parse(data);
    const mainPage = pages.find(p => p.url.includes('localhost:5173') && !p.url.includes('devtools'));
    if (!mainPage) {
      console.log('Main page not found');
      return;
    }

    console.log('Found page:', mainPage.title);
    const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

    ws.on('open', () => {
      console.log('Connected to page via CDP\n');
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      // Test 1: webUtils 노출 확인
      setTimeout(() => {
        console.log('=== [1] webUtils 노출 확인 ===');
        ws.send(JSON.stringify({
          id: 10,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              typeof window.webUtils !== 'undefined' && typeof window.webUtils.getPathForFile === 'function'
                ? 'webUtils.getPathForFile 사용 가능 ✅'
                : 'webUtils.getPathForFile 미노출 ❌'
            `,
            returnByValue: true
          }
        }));
      }, 300);

      // Test 2: Startup IPC 핸들러 확인
      setTimeout(() => {
        console.log('\n=== [2] Startup IPC 핸들러 확인 ===');
        ws.send(JSON.stringify({
          id: 20,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                try {
                  const config = await window.ipcRenderer.invoke('axon:startup:getConfig');
                  return 'getConfig ✅: enabled=' + config.enabled + ', prompts=' + config.prompts.length;
                } catch (e) {
                  return 'getConfig ❌: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 600);

      // Test 3: Startup 리스너 등록 확인 (간접 확인)
      setTimeout(() => {
        console.log('\n=== [3] Startup 이벤트 리스너 확인 ===');
        ws.send(JSON.stringify({
          id: 30,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                try {
                  const prompts = await window.ipcRenderer.invoke('axon:startup:getEnabledPrompts');
                  return 'getEnabledPrompts ✅: ' + prompts.length + '개 활성화됨';
                } catch (e) {
                  return 'getEnabledPrompts ❌: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 900);

      // Test 4: Upload Manager IPC 확인
      setTimeout(() => {
        console.log('\n=== [4] Upload Manager IPC 확인 ===');
        ws.send(JSON.stringify({
          id: 40,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                const results = [];
                try {
                  await window.ipcRenderer.invoke('axon:upload:getConfig');
                  results.push('getConfig ✅');
                } catch (e) { results.push('getConfig ❌'); }
                try {
                  await window.ipcRenderer.invoke('axon:upload:getFiles');
                  results.push('getFiles ✅');
                } catch (e) { results.push('getFiles ❌'); }
                try {
                  await window.ipcRenderer.invoke('axon:upload:getTunnelStatus');
                  results.push('getTunnelStatus ✅');
                } catch (e) { results.push('getTunnelStatus ❌'); }
                return results.join(', ');
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 1200);

      // Test 5: 터널 상태 확인
      setTimeout(() => {
        console.log('\n=== [5] 터널 상태 확인 ===');
        ws.send(JSON.stringify({
          id: 50,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                try {
                  const status = await window.ipcRenderer.invoke('axon:upload:getTunnelStatus');
                  return 'Tunnel Status: ' + status.status + (status.url ? ' (' + status.url + ')' : '');
                } catch (e) {
                  return 'Error: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 1500);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id >= 10 && msg.result?.result) {
        console.log('결과:', msg.result.result.value);
      }
    });

    setTimeout(() => {
      console.log('\n========================================');
      console.log('         종합 검증 완료');
      console.log('========================================');
      ws.close();
      process.exit(0);
    }, 3000);
  });
});
