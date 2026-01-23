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
          const lastMsg = messages[messages.length - 1];
          const text = lastMsg?.innerText || '';

          // Test the regex patterns
          const koreanToolMatch = text.match(/🛠\\s*([a-zA-Z0-9_-]+)(?:[,\\s]|$)/);
          const toolLineMatch = text.match(/🛠\\s*([a-zA-Z0-9_-]+)/);

          // Also test with the actual emoji character
          const hasEmoji = text.includes('🛠');

          // Find the exact line with the emoji
          const lines = text.split('\\n');
          const emojiLine = lines.find(l => l.includes('🛠'));

          return JSON.stringify({
            koreanToolMatch: koreanToolMatch,
            toolLineMatch: toolLineMatch,
            hasEmoji: hasEmoji,
            emojiLine: emojiLine,
            firstChars: text.substring(0, 100),
            textIncludes_isolate: text.includes('isolate')
          }, null, 2);
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.id === 1) {
    console.log('Regex test results:');
    console.log(msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
