import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  console.log('Connected');

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          const messages = document.querySelectorAll('.message-container');
          const msgData = [];

          messages.forEach((msg, i) => {
            const text = msg.innerText?.substring(0, 300) || '';
            const hasAudio = msg.querySelector('audio');
            const links = Array.from(msg.querySelectorAll('a')).map(a => ({
              href: a.href,
              text: a.innerText
            }));

            msgData.push({
              index: i,
              textPreview: text,
              hasAudioElement: !!hasAudio,
              links: links
            });
          });

          // Also check audio settings
          const settings = localStorage.getItem('axon-audio-settings');

          return JSON.stringify({
            messageCount: messages.length,
            messages: msgData,
            audioSettings: settings ? JSON.parse(settings) : null
          }, null, 2);
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.id === 1) {
    console.log('Messages and settings:');
    console.log(msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => { ws.close(); process.exit(0); }, 5000);
