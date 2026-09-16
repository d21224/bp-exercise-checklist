import {webkit} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

const browser = await webkit.launch();
await mkdir('artifacts', {recursive: true});
for (const viewport of [{name: 'phone', width: 390, height: 844}, {name: 'tablet', width: 768, height: 1024}, {name: 'desktop', width: 1440, height: 1000}]) {
  const page = await browser.newPage({viewport: {width: viewport.width, height: viewport.height}});
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:56281/', {waitUntil: 'networkidle'});
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.screenshot({path: `artifacts/${viewport.name}.png`, fullPage: true});
  console.log(JSON.stringify({viewport: viewport.name, overflow, errors, heading: await page.locator('h1').textContent()}));
  await page.close();
}
await browser.close();
