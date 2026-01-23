/**
 * CDP Debug Script - Upload Manager 디버깅 (수정 후 검증)
 */

const http = require('http');
const WebSocket = require('ws');

// Get the page info first
http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const pages = JSON.parse(data);
    const mainPage = pages.find(p => p.url.includes('localhost:5173') && p.title.includes('Dive'));
    if (!mainPage) {
      console.log('Main page not found');
      return;
    }

    console.log('Found page:', mainPage.title);
    console.log('WebSocket URL:', mainPage.webSocketDebuggerUrl);

    const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

    ws.on('open', () => {
      console.log('Connected to page via CDP');

      // Enable console messages
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));

      // Test 1: getConfig (should work)
      setTimeout(() => {
        console.log('\n--- Testing axon:upload:getConfig ---');
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
      }, 500);

      // Test 2: getFiles (should NOW work after fix)
      setTimeout(() => {
        console.log('\n--- Testing axon:upload:getFiles ---');
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                try {
                  const result = await window.ipcRenderer.invoke('axon:upload:getFiles');
                  return JSON.stringify(result, null, 2);
                } catch (e) {
                  return 'Error: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 1000);

      // Test 3: setConfig (correct name now)
      setTimeout(() => {
        console.log('\n--- Testing axon:upload:setConfig ---');
        ws.send(JSON.stringify({
          id: 5,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                try {
                  const config = await window.ipcRenderer.invoke('axon:upload:getConfig');
                  await window.ipcRenderer.invoke('axon:upload:setConfig', config);
                  return 'Success';
                } catch (e) {
                  return 'Error: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 1500);

      // Test 4: cleanupExpired (should NOW work after fix)
      setTimeout(() => {
        console.log('\n--- Testing axon:upload:cleanupExpired ---');
        ws.send(JSON.stringify({
          id: 6,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                try {
                  const result = await window.ipcRenderer.invoke('axon:upload:cleanupExpired');
                  return 'Cleaned up: ' + result + ' files';
                } catch (e) {
                  return 'Error: ' + e.message;
                }
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 2000);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id >= 3 && msg.id <= 6) {
        console.log('Result for test', msg.id, ':');
        if (msg.result && msg.result.result) {
          console.log(msg.result.result.value);
        } else if (msg.error) {
          console.log('CDP Error:', msg.error);
        }
      }
    });

    setTimeout(() => {
      console.log('\n--- Debug complete ---');
      ws.close();
      process.exit(0);
    }, 4000);
  });
});
