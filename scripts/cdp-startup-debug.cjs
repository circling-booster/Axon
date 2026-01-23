/**
 * CDP Startup Debug - 타이밍 문제 진단
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

      // Test 1: Layout 컴포넌트의 useStartupExecution hook 마운트 확인
      setTimeout(() => {
        console.log('=== [1] useStartupExecution 리스너 등록 상태 ===');
        ws.send(JSON.stringify({
          id: 10,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                // IPC 리스너가 등록되어 있는지 확인하기 위해
                // 수동으로 startup execute를 호출해봄
                try {
                  const result = await window.ipcRenderer.invoke('axon:startup:getConfig');
                  return 'Config: enabled=' + result.enabled +
                         ', runOnAppStart=' + result.settings.runOnAppStart +
                         ', prompts=' + result.prompts.length;
                } catch (e) {
                  return 'Error: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 300);

      // Test 2: 수동 실행 트리거
      setTimeout(() => {
        console.log('\n=== [2] 수동 실행 트리거 (axon:startup:execute) ===');
        ws.send(JSON.stringify({
          id: 20,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                try {
                  const result = await window.ipcRenderer.invoke('axon:startup:execute');
                  return 'Execute result: success=' + result.success + ', promptCount=' + result.promptCount;
                } catch (e) {
                  return 'Error: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 600);

      // Test 3: 콘솔 로그 확인을 위해 잠시 대기
      setTimeout(() => {
        console.log('\n=== [3] 콘솔에서 [Startup] Ready to execute 메시지가 보이는지 확인 ===');
        console.log('(앱 콘솔에서 확인 필요)');
      }, 1500);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id >= 10 && msg.result?.result) {
        console.log('Result:', msg.result.result.value);
      }
    });

    setTimeout(() => {
      console.log('\n========================================');
      console.log('         진단 완료');
      console.log('========================================');
      ws.close();
      process.exit(0);
    }, 3000);
  });
});
