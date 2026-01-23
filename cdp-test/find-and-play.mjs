// 드럼 다운로드 링크 찾아서 재생
import puppeteer from 'puppeteer-core';

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

  // 모든 링크 찾기
  const links = await axonPage.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a'));
    return allLinks.map(a => ({
      text: a.innerText,
      href: a.href,
      download: a.download
    }));
  });

  console.log('\n📎 All links found:');
  links.forEach((link, i) => {
    console.log(`  ${i + 1}. "${link.text}" -> ${link.href}`);
  });

  // 드럼 다운로드 링크 찾기
  const drumLink = links.find(l =>
    l.text.includes('드럼') ||
    l.text.includes('drum') ||
    l.href.includes('drum') ||
    l.href.includes('.wav') ||
    l.href.includes('.mp3')
  );

  if (drumLink) {
    console.log('\n🎵 Drum download link found:', drumLink.href);

    // 오디오 재생
    console.log('🔊 Playing audio...');
    await axonPage.evaluate((url) => {
      // 기존 오디오 요소 제거
      const existing = document.getElementById('cdp-audio-player');
      if (existing) existing.remove();

      // 새 오디오 요소 생성
      const audioEl = document.createElement('audio');
      audioEl.id = 'cdp-audio-player';
      audioEl.src = url;
      audioEl.controls = true;
      audioEl.autoplay = true;
      audioEl.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
      document.body.appendChild(audioEl);

      // 재생 시도
      audioEl.play().then(() => {
        console.log('Playing!');
      }).catch(e => {
        console.log('Autoplay blocked, click to play');
      });

      return 'Audio player added';
    }, drumLink.href);

    console.log('✅ Audio player added to page!');
  } else {
    console.log('\n⚠️ Drum link not found');

    // 페이지 HTML에서 href 직접 찾기
    const hrefs = await axonPage.evaluate(() => {
      const html = document.body.innerHTML;
      const hrefMatches = html.match(/href="([^"]+)"/g) || [];
      return hrefMatches.slice(-20);
    });
    console.log('Recent hrefs in HTML:', hrefs);
  }

  await browser.disconnect();
  console.log('\n✅ Done');
}

main().catch(console.error);
