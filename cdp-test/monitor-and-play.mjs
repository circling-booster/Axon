// Axon 앱 응답 모니터링 및 오디오 자동 재생
import puppeteer from 'puppeteer-core';

const MESSAGE = "'https://onlinetestcase.com/wp-content/uploads/2023/06/100-KB-MP3.mp3' 를 드럼만 추출해줘";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔗 Connecting to Axon app...\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  const axonPage = pages.find(p => p.url().includes('localhost:5173'));

  if (!axonPage) {
    console.log('❌ Axon page not found');
    await browser.disconnect();
    return;
  }

  console.log('✅ Connected to Axon app');

  // 메시지 전송
  console.log('📝 Sending message:', MESSAGE);
  const inputSelector = 'textarea';
  await axonPage.waitForSelector(inputSelector, { timeout: 5000 });
  await axonPage.click(inputSelector);
  await axonPage.type(inputSelector, MESSAGE);
  await axonPage.keyboard.press('Enter');
  console.log('📤 Message sent!\n');

  // 응답 모니터링
  console.log('👀 Monitoring for response...\n');

  let audioUrl = null;
  let attempts = 0;
  const maxAttempts = 60; // 최대 60초 대기

  while (!audioUrl && attempts < maxAttempts) {
    attempts++;

    // 페이지에서 오디오 URL 찾기
    const result = await axonPage.evaluate(() => {
      // 페이지 내 모든 텍스트에서 오디오 URL 찾기
      const bodyText = document.body.innerText;

      // 오디오 URL 패턴 찾기
      const urlPatterns = [
        /https?:\/\/[^\s<>"]+\.(mp3|wav|ogg|m4a|flac)/gi,
        /https?:\/\/[^\s<>"]+audio[^\s<>"]*/gi,
        /https?:\/\/[^\s<>"]+\/drums[^\s<>"]*/gi
      ];

      for (const pattern of urlPatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          // 원본 URL 제외
          const filtered = matches.filter(url =>
            !url.includes('onlinetestcase.com') &&
            !url.includes('100-KB-MP3')
          );
          if (filtered.length > 0) {
            return { found: true, url: filtered[filtered.length - 1], text: bodyText.slice(-500) };
          }
        }
      }

      // audio 태그 찾기
      const audioElements = document.querySelectorAll('audio');
      if (audioElements.length > 0) {
        const lastAudio = audioElements[audioElements.length - 1];
        if (lastAudio.src) {
          return { found: true, url: lastAudio.src, type: 'audio-element' };
        }
      }

      // 마지막 메시지 영역 확인
      const messages = document.querySelectorAll('[class*="message"], [class*="response"], [class*="assistant"]');
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        const links = lastMessage.querySelectorAll('a[href*=".mp3"], a[href*=".wav"], a[href*="audio"]');
        if (links.length > 0) {
          return { found: true, url: links[links.length - 1].href, type: 'link' };
        }
      }

      return { found: false, messageCount: messages.length };
    });

    if (result.found) {
      audioUrl = result.url;
      console.log(`\n🎵 Audio URL found: ${audioUrl}`);
      break;
    }

    // 진행 상황 출력
    if (attempts % 5 === 0) {
      console.log(`⏳ Waiting... (${attempts}s)`);
    }

    await sleep(1000);
  }

  if (audioUrl) {
    console.log('\n🔊 Auto-playing audio...');

    // 오디오 자동 재생
    await axonPage.evaluate((url) => {
      const audio = new Audio(url);
      audio.play().catch(e => console.log('Autoplay blocked:', e));

      // 또는 페이지에 audio 태그 추가
      const audioEl = document.createElement('audio');
      audioEl.src = url;
      audioEl.controls = true;
      audioEl.autoplay = true;
      audioEl.style.position = 'fixed';
      audioEl.style.bottom = '20px';
      audioEl.style.right = '20px';
      audioEl.style.zIndex = '9999';
      document.body.appendChild(audioEl);

      return 'Audio element added';
    }, audioUrl);

    console.log('✅ Audio playback initiated!');
  } else {
    console.log('\n⚠️ No audio URL found after waiting');
    console.log('Checking final page state...');

    const finalState = await axonPage.evaluate(() => {
      return document.body.innerText.slice(-1000);
    });
    console.log('Last content:', finalState);
  }

  await browser.disconnect();
  console.log('\n✅ Done');
}

main().catch(console.error);
