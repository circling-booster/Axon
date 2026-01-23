import WebSocket from 'ws';

// Get the current page ID first
const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title === 'Dive AI' && t.type === 'page');

if (!mainPage) {
  console.log('Main page not found');
  process.exit(1);
}

console.log('Connecting to:', mainPage.webSocketDebuggerUrl);
const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', async () => {
  console.log('Connected');

  // Check current URL and state
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          return JSON.stringify({
            url: window.location.href,
            pathname: window.location.pathname,
            hash: window.location.hash,
            hasChatMessages: !!document.querySelector('.chat-messages'),
            hasChatPage: !!document.querySelector('.chat-page'),
            messageCount: document.querySelectorAll('.message-container').length
          });
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.id === 1) {
    console.log('Current state:', msg.result?.result?.value);

    // Check localStorage for audio settings
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            const settings = localStorage.getItem('axon-audio-settings');
            return JSON.stringify({
              audioSettings: settings ? JSON.parse(settings) : null
            });
          })()
        `
      }
    }));
  }

  if (msg.id === 2) {
    console.log('Audio settings:', msg.result?.result?.value);

    // Now let's check what components are rendered
    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            // Check for AudioMixer and AudioWatcher in React fiber
            const root = document.getElementById('root');
            const fiber = root?._reactRootContainer?._internalRoot?.current;

            // Simple check for rendered components
            return JSON.stringify({
              rootExists: !!root,
              chatContainerHTML: document.querySelector('.chat-container')?.innerHTML?.substring(0, 200) || 'no chat-container',
              hasAudioMixerClass: !!document.querySelector('.audio-mixer')
            });
          })()
        `
      }
    }));
  }

  if (msg.id === 3) {
    console.log('Components:', msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('Timeout');
  ws.close();
  process.exit(1);
}, 5000);
