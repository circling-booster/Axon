// Axon 앱에 메시지 전송
import puppeteer from 'puppeteer-core';

const MESSAGE = process.argv[2] || "윤하의 사건의지평선 가사를 알려줘";

async function main() {
  console.log('🔗 Connecting to Axon app...');

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
  console.log('📝 Message to send:', MESSAGE);

  // 입력창 찾기 및 메시지 입력
  const inputSelector = 'textarea';

  await axonPage.waitForSelector(inputSelector, { timeout: 5000 });

  // 입력창에 포커스 및 텍스트 입력
  await axonPage.click(inputSelector);
  await axonPage.type(inputSelector, MESSAGE);

  console.log('✍️ Message typed into input');

  // 전송 버튼 클릭 또는 Enter 키
  await axonPage.keyboard.press('Enter');

  console.log('📤 Message sent!');

  await browser.disconnect();
  console.log('✅ Done');
}

main().catch(console.error);
