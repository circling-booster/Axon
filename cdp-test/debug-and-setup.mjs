import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();

console.log('All targets:');
targets.forEach((t, i) => {
  console.log(`${i}: type=${t.type}, title="${t.title}"`);
});

const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

if (!mainPage) {
  console.log('\nNo Dive page found!');
  process.exit(1);
}

console.log('\nUsing:', mainPage.title);

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  console.log('Connected');

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          // Set settings first
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

          // Now check page state
          const mixerElement = document.querySelector('.audio-mixer');
          const messages = document.querySelectorAll('.message-container');
          const lastMsg = messages[messages.length - 1];
          const lastMsgText = lastMsg?.innerText || '';
          const audioExtensions = ['.wav', '.mp3', '.ogg', '.flac'];
          const hasAudioUrl = audioExtensions.some(ext => lastMsgText.includes(ext));
          const emojiToolMatch = lastMsgText.match(/🛠\\s*([a-zA-Z0-9_-]+)/);

          return JSON.stringify({
            settingsSaved: true,
            url: window.location.pathname,
            mixerVisible: !!mixerElement,
            messagesCount: messages.length,
            hasAudioUrl: hasAudioUrl,
            emojiToolMatch: emojiToolMatch ? emojiToolMatch[1] : null,
            lastMsgPreview: lastMsgText.substring(0, 400)
          }, null, 2);
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.id === 1) {
    console.log('\nApp state:');
    console.log(msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
