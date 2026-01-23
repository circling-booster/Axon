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
          // Try to access React fiber to check component state
          const chatContainer = document.querySelector('.chat-container');

          // Try to find AudioWatcher in the React tree
          // This is hacky but useful for debugging
          let found = false;

          // Check if the AudioMixer component is in the DOM at all
          const allElements = document.querySelectorAll('*');
          let audioMixerParent = null;
          allElements.forEach(el => {
            if (el.className && el.className.includes && el.className.includes('audio-mixer')) {
              audioMixerParent = el.parentElement?.className;
              found = true;
            }
          });

          // Check chat-messages-container children
          const chatMsgContainer = document.querySelector('.chat-messages-container');
          const chatMsgContainerChildren = chatMsgContainer ? Array.from(chatMsgContainer.children).map(c => c.className) : [];

          return JSON.stringify({
            chatContainerExists: !!chatContainer,
            audioMixerFound: found,
            audioMixerParent: audioMixerParent,
            chatMsgContainerChildren: chatMsgContainerChildren
          }, null, 2);
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.id === 1) {
    console.log('DOM structure:');
    console.log(msg.result?.result?.value);

    // Let's also check if there's a build error by looking at the source
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            // Check if the folk/audio module was loaded
            // We can check by looking for style rules
            const styleSheets = Array.from(document.styleSheets);
            let audioMixerStyleFound = false;

            try {
              styleSheets.forEach(sheet => {
                try {
                  const rules = Array.from(sheet.cssRules || []);
                  rules.forEach(rule => {
                    if (rule.cssText && rule.cssText.includes('.audio-mixer')) {
                      audioMixerStyleFound = true;
                    }
                  });
                } catch (e) {
                  // Cross-origin stylesheet, skip
                }
              });
            } catch (e) {}

            return JSON.stringify({
              audioMixerStyleFound: audioMixerStyleFound,
              totalStyleSheets: styleSheets.length
            });
          })()
        `
      }
    }));
  }

  if (msg.id === 2) {
    console.log('\nStyle check:');
    console.log(msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 10000);
