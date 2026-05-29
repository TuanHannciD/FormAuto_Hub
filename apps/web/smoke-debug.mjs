import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:3000/login', { timeout: 15000 });
await page.fill('input[type="email"]', 'admin@formauto.local');
await page.fill('input[type="password"]', 'Admin@123456');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard**', { timeout: 10000 });

await page.goto('http://localhost:3000/dashboard/forms', { timeout: 15000 });
await page.waitForTimeout(3000);

// Debug: print all inputs
const inputs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('input, textarea, select')).map(e => ({
    tag: e.tagName,
    type: e.type || '',
    placeholder: e.placeholder || '',
    name: e.name || '',
    className: e.className?.slice(0, 80) || ''
  }));
});
console.log('Found', inputs.length, 'inputs');
inputs.forEach((inp, i) => console.log(i, inp.tag, inp.type, '"' + inp.placeholder + '"'));

// Also check all buttons
const btns = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(e => e.textContent?.trim()?.slice(0, 40));
});
console.log('\nButtons:', btns.filter(Boolean));

// Get the form analysis section HTML
const sectionHtml = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  return h1?.parentElement?.parentElement?.innerHTML?.slice(0, 500);
});
console.log('\nSection HTML snippet:', sectionHtml);

await browser.close();
