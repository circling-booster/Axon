import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  // First check current page
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          return JSON.stringify({
            url: window.location.href,
            pathname: window.location.pathname,
            title: document.title
          });
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  
  if (msg.id === 1) {
    console.log('Current page:', msg.result?.result?.value);
    
    // Set audio settings
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            const settings = {
              globalAutoPlayEnabled: true,
              defaultVolume: 0.8,
              mcpToolSettings: {
                "isolate_vocals": { autoPlayEnabled: true, defaultVolume: 0.8 },
                "isolate_drums": { autoPlayEnabled: true, defaultVolume: 0.8 },
                "isolate_bass": { autoPlayEnabled: true, defaultVolume: 0.8 },
                "isolate_other": { autoPlayEnabled: true, defaultVolume: 0.8 },
                "demucs": { autoPlayEnabled: true, defaultVolume: 0.8 },
                "separate_tracks": { autoPlayEnabled: true, defaultVolume: 0.8 }
              }
            };
            localStorage.setItem('axon-audio-settings', JSON.stringify(settings));
            return 'Settings saved!';
          })()
        `
      }
    }));
  }
  
  if (msg.id === 2) {
    console.log('Result:', msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
