import WebSocket from 'ws';

const response = await fetch('http://localhost:9222/json');
const targets = await response.json();
const mainPage = targets.find(t => t.title.includes('Dive') && t.type === 'page');

const ws = new WebSocket(mainPage.webSocketDebuggerUrl);

ws.on('open', () => {
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (function() {
          const messages = document.querySelectorAll('.message-container');
          const lastMsg = messages[messages.length - 1];

          // Get all links in the message
          const links = lastMsg?.querySelectorAll('a') || [];
          const linkData = Array.from(links).map(a => ({
            href: a.href,
            text: a.innerText
          }));

          // Filter for audio URLs
          const audioExtensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a'];
          const audioLinks = linkData.filter(l =>
            audioExtensions.some(ext => l.href.toLowerCase().includes(ext))
          );

          // Get raw HTML snippet
          const htmlSnippet = lastMsg?.innerHTML?.substring(0, 1000) || '';

          return JSON.stringify({
            totalLinks: linkData.length,
            audioLinks: audioLinks,
            firstFewLinks: linkData.slice(0, 10),
            htmlSnippet: htmlSnippet
          }, null, 2);
        })()
      `
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.id === 1) {
    console.log('Link analysis:');
    console.log(msg.result?.result?.value);
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
