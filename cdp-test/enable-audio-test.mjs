import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title === 'Dive AI' && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', async () => {
  console.log('Connected');

  // Set audio settings to enable testing
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          // Set audio settings with test MCP tool enabled
          const settings = {
            globalAutoPlayEnabled: true,
            defaultVolume: 0.8,
            mcpToolSettings: {
              "demucs": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "audio-separator": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "test": { autoPlayEnabled: true, defaultVolume: 0.8 }
            }
          };
          localStorage.setItem('axon-audio-settings', JSON.stringify(settings));

          // Also check if Jotai store is accessible
          return JSON.stringify({
            settingsStored: true,
            stored: localStorage.getItem('axon-audio-settings')
          });
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.id === 1) {
    console.log('Audio settings enabled:', msg.result?.result?.value);

    // Now navigate to a chat if possible
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            // Check if there's a recent chat in history
            const historyItems = document.querySelectorAll('.history-item');
            if (historyItems.length > 0) {
              // Click the first history item
              historyItems[0].click();
              return JSON.stringify({ navigated: true, itemCount: historyItems.length });
            }
            return JSON.stringify({ navigated: false, reason: 'no history items' });
          })()
        `
      }
    }));
  }

  if (msg.id === 2) {
    console.log('Navigation result:', msg.result?.result?.value);
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 500);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
