// CDP Inspector - 현재 실행 중인 Electron 앱 정보 확인
import puppeteer from 'puppeteer-core';

async function main() {
  console.log('🔗 Connecting to CDP...\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  console.log('✅ Connected!\n');

  const pages = await browser.pages();
  console.log(`📄 Found ${pages.length} page(s)\n`);

  for (const page of pages) {
    const url = page.url();
    const title = await page.title();

    console.log(`Page: "${title}"`);
    console.log(`URL: ${url}\n`);

    // 페이지 내용 확인
    const content = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body?.innerText?.slice(0, 500) || 'No body',
        links: Array.from(document.querySelectorAll('a')).slice(0, 5).map(a => ({
          text: a.innerText,
          href: a.href
        }))
      };
    });

    console.log('📝 Page Content:');
    console.log('Title:', content.title);
    console.log('Body preview:', content.bodyText.slice(0, 200));
    console.log('Links:', content.links);
  }

  await browser.disconnect();
  console.log('\n✅ Done');
}

main().catch(console.error);
