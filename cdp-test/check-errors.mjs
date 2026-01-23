import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

let errors = [];

ws.on('open', () => {
  console.log('Connected - checking for errors...');

  ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

  // Check for any module import errors
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            // Check if folk/audio module is loaded
            // Try to access the settings from localStorage
            const settings = localStorage.getItem('axon-audio-settings');

            // Check if there were any errors during page load
            const errorElements = document.querySelectorAll('[class*="error"]');

            return JSON.stringify({
              hasSettings: !!settings,
              settings: settings ? JSON.parse(settings) : null,
              errorElementsCount: errorElements.length,
              url: window.location.href
            });
          })()
        `
      }
    }));
  }, 500);

  // Also reload the page to catch any load errors
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 4,
      method: 'Page.reload'
    }));
  }, 1000);

  // Check state after reload
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 5,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            const chatPage = document.querySelector('.chat-page');
            const audioMixer = document.querySelector('.audio-mixer');
            const chatMessages = document.querySelector('.chat-messages');

            return JSON.stringify({
              hasChatPage: !!chatPage,
              hasAudioMixer: !!audioMixer,
              hasChatMessages: !!chatMessages,
              messageContainers: document.querySelectorAll('.message-container').length
            });
          })()
        `
      }
    }));
  }, 3000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  // Log console errors
  if (msg.method === 'Console.messageAdded') {
    const level = msg.params?.message?.level;
    const text = msg.params?.message?.text;
    if (level === 'error') {
      console.log('[ERROR]', text);
      errors.push(text);
    }
  }

  if (msg.method === 'Runtime.exceptionThrown') {
    const error = msg.params?.exceptionDetails;
    console.log('[EXCEPTION]', error?.text || JSON.stringify(error));
    errors.push(error?.text);
  }

  if (msg.id === 3) {
    console.log('Initial state:', msg.result?.result?.value);
  }

  if (msg.id === 5) {
    console.log('After reload:', msg.result?.result?.value);
    console.log('\nTotal errors found:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('Timeout - errors:', errors);
  ws.close();
  process.exit(0);
}, 8000);
