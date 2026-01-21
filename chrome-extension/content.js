// content.js

(function() {
  // 이미 주입되었다면 중복 실행 방지
  if (document.getElementById('axon-extension-root')) return;

  // --- 설정 및 상수 ---
  const AXON_API_URL = 'http://localhost:19999/api/chat';
  let chatId = crypto.randomUUID(); // 새로운 채팅 세션 ID 생성

  // --- UI 생성 (Shadow DOM 사용) ---
  const host = document.createElement('div');
  host.id = 'axon-extension-root';
  document.body.appendChild(host);
  
  const shadow = host.attachShadow({ mode: 'open' });

  // 스타일 정의
  const style = document.createElement('style');
  style.textContent = `
    :host {
      --axon-bg: #1e1e1e;
      --axon-text: #e0e0e0;
      --axon-primary: #3b82f6;
      --axon-border: #333;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .axon-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      background: var(--axon-primary);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: transform 0.2s;
    }
    .axon-fab:hover { transform: scale(1.05); }
    .axon-fab svg { width: 28px; height: 28px; fill: white; }
    
    .axon-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 600px;
      background: var(--axon-bg);
      border: 1px solid var(--axon-border);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      z-index: 999999;
      overflow: hidden;
    }
    .axon-window.visible { display: flex; }
    
    .header {
      padding: 16px;
      border-bottom: 1px solid var(--axon-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #252525;
      color: white;
      font-weight: 600;
    }
    .close-btn { cursor: pointer; background: none; border: none; color: #888; font-size: 18px; }
    .close-btn:hover { color: white; }

    .chat-history {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .message.user {
      align-self: flex-end;
      background: var(--axon-primary);
      color: white;
    }
    .message.assistant {
      align-self: flex-start;
      background: #333;
      color: var(--axon-text);
    }
    .message.error {
      align-self: center;
      background: #4a1b1b;
      color: #ff9999;
      font-size: 12px;
    }

    .input-area {
      padding: 12px;
      border-top: 1px solid var(--axon-border);
      background: #252525;
    }
    .input-wrapper {
      display: flex;
      gap: 8px;
    }
    textarea {
      flex: 1;
      height: 40px;
      border-radius: 8px;
      border: 1px solid #444;
      background: #1e1e1e;
      color: white;
      padding: 8px;
      resize: none;
      font-family: inherit;
    }
    textarea:focus { outline: none; border-color: var(--axon-primary); }
    button.send-btn {
      background: var(--axon-primary);
      border: none;
      border-radius: 8px;
      color: white;
      padding: 0 16px;
      cursor: pointer;
      font-weight: 600;
    }
    button.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .tools {
      margin-top: 8px;
      display: flex;
      gap: 8px;
    }
    .tool-btn {
      background: #333;
      border: 1px solid #444;
      color: #aaa;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    }
    .tool-btn:hover { background: #444; color: white; }
    .tool-btn.active { background: #3b82f640; color: #3b82f6; border-color: #3b82f6; }
  `;
  shadow.appendChild(style);

  // 컨테이너 생성
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="axon-fab" id="fab">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </div>
    
    <div class="axon-window" id="window">
      <div class="header">
        <span>Axon Assistant</span>
        <button class="close-btn" id="close">×</button>
      </div>
      <div class="chat-history" id="history">
        <div class="message assistant">안녕하세요! 무엇을 도와드릴까요?</div>
      </div>
      <div class="input-area">
        <div class="input-wrapper">
          <textarea id="prompt" placeholder="메시지를 입력하세요..."></textarea>
          <button id="send" class="send-btn">전송</button>
        </div>
        <div class="tools">
          <button id="btn-context" class="tool-btn">📄 현재 페이지 내용 포함</button>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(container);

  // --- 엘리먼트 참조 ---
  const fab = shadow.getElementById('fab');
  const win = shadow.getElementById('window');
  const closeBtn = shadow.getElementById('close');
  const historyDiv = shadow.getElementById('history');
  const inputEl = shadow.getElementById('prompt');
  const sendBtn = shadow.getElementById('send');
  const contextBtn = shadow.getElementById('btn-context');

  // --- 상태 변수 ---
  let isContextActive = false;
  let isGenerating = false;

  // --- 이벤트 핸들러 ---
  fab.addEventListener('click', () => {
    win.classList.toggle('visible');
    if (win.classList.contains('visible')) inputEl.focus();
  });

  closeBtn.addEventListener('click', () => win.classList.remove('visible'));

  contextBtn.addEventListener('click', () => {
    isContextActive = !isContextActive;
    contextBtn.classList.toggle('active', isContextActive);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // --- 메시지 전송 로직 (Axon API 연동) ---
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isGenerating) return;

    // 1. 사용자 메시지 표시
    appendMessage(text, 'user');
    inputEl.value = '';
    isGenerating = true;
    sendBtn.disabled = true;

    // 2. 컨텍스트 구성
    let fullMessage = text;
    if (isContextActive) {
      const pageContent = document.body.innerText.substring(0, 5000); // 길이 제한
      fullMessage = `[Context from webpage: ${document.title}]\n${pageContent}\n\n[User Query]\n${text}`;
      isContextActive = false;
      contextBtn.classList.remove('active');
    }

    // 3. 폼 데이터 구성 (Axon /api/chat 스펙 준수)
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('message', fullMessage);
    // 파일 업로드 필요시 여기에 files append

    try {
      // 4. API 요청 (스트리밍)
      const response = await fetch(AXON_API_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      // 5. SSE 스트림 읽기
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageEl = appendMessage('', 'assistant'); // 빈 메시지 생성
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const data = JSON.parse(dataStr);
              // Axon의 StreamMessage 구조 처리
              // type: "text", "chat_info", "token_usage", "error" 등
              if (data.message) {
                // 이중 JSON 인코딩된 경우가 있어 한 번 더 파싱 시도
                const inner = JSON.parse(data.message);
                
                if (inner.type === 'text') {
                  // 일반 텍스트 응답
                  const content = inner.content;
                  // 마크다운이나 텍스트 처리 (여기서는 단순 텍스트 추가)
                  accumulatedText += content.text || content; 
                  aiMessageEl.innerText = accumulatedText;
                  historyDiv.scrollTop = historyDiv.scrollHeight;
                } else if (inner.type === 'error') {
                  appendMessage(`Error: ${inner.content.message}`, 'error');
                }
              }
            } catch (e) {
              // 단순 텍스트인 경우 무시
            }
          }
        }
      }

    } catch (err) {
      console.error('Axon Chat Error:', err);
      appendMessage('Axon 서버에 연결할 수 없습니다. (포트 19999 확인 필요)', 'error');
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  function appendMessage(text, role) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerText = text;
    historyDiv.appendChild(div);
    historyDiv.scrollTop = historyDiv.scrollHeight;
    return div;
  }

})();