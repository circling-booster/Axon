import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  console.log('Connected');

  // Enable audio settings for various tool names
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          // Set audio settings enabling common MCP tools
          const settings = {
            globalAutoPlayEnabled: true,
            defaultVolume: 0.8,
            mcpToolSettings: {
              "demucs": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "isolate_vocals": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "isolate_instrumental": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "isolate_drums": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "isolate_bass": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "audio-separator": { autoPlayEnabled: true, defaultVolume: 0.8 },
              "unknown": { autoPlayEnabled: true, defaultVolume: 0.8 }
            }
          };
          localStorage.setItem('axon-audio-settings', JSON.stringify(settings));

          // Force reload to trigger detection
          return JSON.stringify({
            success: true,
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
    console.log('Settings stored:', msg.result?.result?.value);

    // Now trigger a re-render or check the React state
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            // Check if we can access the audio module
            const audioLinks = document.querySelectorAll('a[href$=".wav"], a[href$=".mp3"]');

            return JSON.stringify({
              audioLinksFound: audioLinks.length,
              links: Array.from(audioLinks).map(a => a.href)
            });
          })()
        `
      }
    }));
  }

  if (msg.id === 2) {
    console.log('Audio links:', msg.result?.result?.value);
    console.log('\\nSettings activated. Please refresh the page or send a new message to trigger audio detection.');
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => { ws.close(); process.exit(0); }, 5000);
