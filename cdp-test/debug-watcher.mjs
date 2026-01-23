import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  console.log('Connected');

  // Inject debugging to check AudioWatcher behavior
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          // Get last assistant message
          const messages = document.querySelectorAll('.message-container');
          let lastAssistantMsg = null;

          messages.forEach((msg, i) => {
            const isSent = msg.querySelector('.message.sent');
            if (!isSent) {
              lastAssistantMsg = {
                index: i,
                text: msg.innerText?.substring(0, 500)
              };
            }
          });

          // Try to manually parse audio links like AudioWatcher does
          const audioExtensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac', '.webm'];
          const text = lastAssistantMsg?.text || '';

          // Check for tool-call pattern
          const toolCallMatch = text.match(/<tool-call[^>]*name="([^"]+)"/);

          // Check for Korean pattern
          const koreanToolMatch = text.match(/🛠\\s*([a-zA-Z0-9_-]+)/);

          // Get settings
          const settings = JSON.parse(localStorage.getItem('axon-audio-settings') || '{}');

          return JSON.stringify({
            hasLastAssistantMsg: !!lastAssistantMsg,
            toolCallMatch: toolCallMatch ? toolCallMatch[1] : null,
            koreanToolMatch: koreanToolMatch ? koreanToolMatch[1] : null,
            settings: settings,
            textPreview: text.substring(0, 300)
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

    // Now let's check if we can manually trigger the audio session
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            // Check the exact message text to understand the format
            const messages = document.querySelectorAll('.message-container');
            const lastMsg = messages[messages.length - 1];
            const rawHTML = lastMsg?.innerHTML?.substring(0, 1000);

            // Look for links
            const links = lastMsg?.querySelectorAll('a');
            const linkData = Array.from(links || []).map(a => ({
              href: a.href,
              text: a.innerText,
              isAudio: a.href.includes('.wav') || a.href.includes('.mp3')
            }));

            return JSON.stringify({
              rawHTMLPreview: rawHTML,
              links: linkData
            }, null, 2);
          })()
        `
      }
    }));
  }

  if (msg.id === 2) {
    console.log('\nRaw HTML and links:');
    console.log(msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 10000);
