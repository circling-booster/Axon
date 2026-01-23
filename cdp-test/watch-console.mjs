import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  console.log('Connected - watching console for AudioWatcher logs...\n');

  ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

  // Refresh the page to trigger the new code
  setTimeout(() => {
    console.log('Reloading page...\n');
    ws.send(JSON.stringify({ id: 3, method: 'Page.reload' }));
  }, 500);

  // Navigate to chat after reload
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 4,
      method: 'Runtime.evaluate',
      params: {
        expression: `window.location.hash = '#/chat/f0f91f70-550c-4e06-989f-d50a02e0f875';`
      }
    }));
  }, 3000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  // Log all console messages containing "AudioWatcher"
  if (msg.method === 'Console.messageAdded') {
    const text = msg.params?.message?.text || '';
    const level = msg.params?.message?.level;

    if (text.includes('AudioWatcher') || text.includes('audio')) {
      console.log(`[${level}]`, text);
    }
  }

  // Log runtime exceptions
  if (msg.method === 'Runtime.exceptionThrown') {
    console.log('[EXCEPTION]', msg.params?.exceptionDetails?.text);
  }
});

// Keep watching for 20 seconds
setTimeout(() => {
  console.log('\nDone watching.');
  ws.close();
  process.exit(0);
}, 20000);
