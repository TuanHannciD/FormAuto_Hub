import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Login
console.log('=== Login ===');
await page.goto('http://localhost:3000/login', { timeout: 15000 });
await page.fill('input[type="email"]', 'admin@formauto.local');
await page.fill('input[type="password"]', 'Admin@123456');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard**', { timeout: 10000 });
console.log('Logged in');

// Forms page
console.log('\n=== Forms ===');
await page.goto('http://localhost:3000/dashboard/forms', { timeout: 15000 });
await page.waitForTimeout(2000);

// Fill form URL and name
const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeNXy2Qycx9Dz2Rym8-Aqx4poqc_4fGLCPPFyTEKkJxa2VBtg/viewform';
await page.fill('input[placeholder*="docs.google.com"]', formUrl);
await page.fill('input[placeholder*="Tên nội bộ"]', 'Playwright Smoke');
console.log('Filled inputs');

// Click analyze
await page.click('button:has-text("Phân tích biểu mẫu")');
console.log('Analyzing...');

// Wait for questions to appear (section 2)
await page.waitForTimeout(15000);

const bodyText = await page.evaluate(() => document.body.textContent);
console.log('\nAfter analysis:');
console.log('Has "Option 2":', bodyText.includes('Option 2'));
console.log('Has "Option 3":', bodyText.includes('Option 3'));
console.log('Has "AI mặc định":', bodyText.includes('AI mặc định'));
console.log('Has "AI tùy chỉnh":', bodyText.includes('AI tùy chỉnh'));
console.log('Has "x2":', bodyText.includes('x2'));
console.log('Has "x3":', bodyText.includes('x3'));
console.log('Has "Điền prompt":', bodyText.includes('Điền prompt'));
console.log('Has "Prompt chung":', bodyText.includes('Prompt chung'));
console.log('Has "AI preview chỉ đọc":', bodyText.includes('AI preview chỉ đọc'));

// Check mode buttons
const modeButtons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(e => e.textContent?.trim()).filter(t => t && (t.includes('Option') || t.includes('x2') || t.includes('x3')));
});
console.log('\nAI mode buttons:', modeButtons);

// Screenshots for each mode
await page.screenshot({ path: 'C:/Users/Tuan/OneDrive/Desktop/FormAuto_Hub/smoke-option1-default.png', fullPage: true });
console.log('\nScreenshot: option1 (default rules view)');

// Click Option 2
const opt2Btn = page.locator('button').filter({ hasText: 'Option 2' });
if (await opt2Btn.isVisible()) {
  await opt2Btn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/Tuan/OneDrive/Desktop/FormAuto_Hub/smoke-option2-ai.png', fullPage: true });
  console.log('Screenshot: option2 (AI default)');
}

// Click Option 3
const opt3Btn = page.locator('button').filter({ hasText: 'Option 3' });
if (await opt3Btn.isVisible()) {
  await opt3Btn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/Tuan/OneDrive/Desktop/FormAuto_Hub/smoke-option3-custom.png', fullPage: true });
  console.log('Screenshot: option3 (AI custom)');
}

await browser.close();
console.log('\nDone');
