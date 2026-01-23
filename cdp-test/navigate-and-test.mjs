import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  console.log('Connected');

  // Navigate to the chat with audio links
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          // Navigate to the specific chat
          window.location.hash = '#/chat/f0f91f70-550c-4e06-989f-d50a02e0f875';
          return 'Navigating...';
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.id === 1) {
    console.log('Navigation started');

    // Wait for page to load
    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (function() {
              const chatPage = document.querySelector('.chat-page');
              const audioMixer = document.querySelector('.audio-mixer');
              const chatMessages = document.querySelector('.chat-messages');
              const messages = document.querySelectorAll('.message-container');
              const audioLinks = document.querySelectorAll('a[href$=".wav"], a[href$=".mp3"]');

              return JSON.stringify({
                hasChatPage: !!chatPage,
                hasAudioMixer: !!audioMixer,
                hasChatMessages: !!chatMessages,
                messageCount: messages.length,
                audioLinksCount: audioLinks.length,
                url: window.location.href
              });
            })()
          `
        }
      }));
    }, 2000);
  }

  if (msg.id === 2) {
    console.log('Page state after navigation:', msg.result?.result?.value);

    // Check if AudioWatcher is processing messages
    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            // Check Jotai state if accessible
            const settings = localStorage.getItem('axon-audio-settings');

            // Try to find message text containing audio links
            const messageElements = document.querySelectorAll('.message-container');
            let hasAudioLinks = false;

            messageElements.forEach(el => {
              const links = el.querySelectorAll('a[href$=".wav"]');
              if (links.length > 0) {
                hasAudioLinks = true;
              }
            });

            return JSON.stringify({
              settingsExist: !!settings,
              hasMessageWithAudioLinks: hasAudioLinks,
              audioMixerVisible: !!document.querySelector('.audio-mixer')
            });
          })()
        `
      }
    }));
  }

  if (msg.id === 3) {
    console.log('Final check:', msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 10000);
