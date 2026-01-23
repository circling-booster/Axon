import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.type === 'page');

if (!mainPage) {
  console.log('No page found');
  process.exit(1);
}

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          const settings = localStorage.getItem('axon-audio-settings');
          const mixerElement = document.querySelector('.audio-mixer');
          const messages = document.querySelectorAll('.message-container');
          const lastMsg = messages[messages.length - 1];
          const lastMsgText = lastMsg?.innerText || '';
          const audioExtensions = ['.wav', '.mp3', '.ogg', '.flac'];
          const hasAudioUrl = audioExtensions.some(ext => lastMsgText.includes(ext));
          const lastMsgHtml = lastMsg?.innerHTML || '';
          const toolCallInHtml = lastMsgHtml.includes('tool-call');
          const emojiToolMatch = lastMsgText.match(/🛠\s*([a-zA-Z0-9_-]+)/);

          return JSON.stringify({
            settingsExist: !!settings,
            settings: settings ? JSON.parse(settings) : null,
            mixerVisible: !!mixerElement,
            lastMsgPreview: lastMsgText.substring(0, 500),
            hasAudioUrl: hasAudioUrl,
            toolCallInHtml: toolCallInHtml,
            emojiToolMatch: emojiToolMatch ? emojiToolMatch[1] : null,
            messagesCount: messages.length
          }, null, 2);
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.id === 1) {
    console.log('Debug info:');
    console.log(msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
