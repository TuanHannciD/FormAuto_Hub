import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Step 1: Login
console.log('=== Login ===');
await page.goto('http://localhost:3000/login', { timeout: 15000 });
await page.fill('input[type="email"]', 'admin@formauto.local');
await page.fill('input[type="password"]', 'Admin@123456');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard**', { timeout: 10000 });
console.log('✅ Logged in, URL:', page.url());

// Step 2: Go to Forms page
console.log('\n=== Dashboard Forms ===');
await page.goto('http://localhost:3000/dashboard/forms', { timeout: 15000 });
await page.waitForTimeout(3000);

const pageText = await page.textContent('body');
console.log('Contains "FormAuto":', pageText.includes('FormAuto'));
console.log('Contains "Option":', pageText.includes('Option'));
console.log('Contains "x2":', pageText.includes('x2'));
console.log('Contains "x3":', pageText.includes('x3'));
console.log('Contains "Điền prompt":', pageText.includes('Điền prompt'));

await page.screenshot({ path: 'C:/Users/Tuan/OneDrive/Desktop/FormAuto_Hub/smoke-forms-page.png', fullPage: true });
console.log('✅ Screenshot: smoke-forms-page.png');

// Step 3: Admin AI Settings
console.log('\n=== Admin AI Settings ===');
await page.goto('http://localhost:3000/admin/ai-provider-settings', { timeout: 15000 });
await page.waitForTimeout(2000);
const aiText = await page.textContent('body');
console.log('Contains "Deepseek":', aiText.includes('Deepseek'));
console.log('Contains "Ready":', aiText.includes('Ready'));
await page.screenshot({ path: 'C:/Users/Tuan/OneDrive/Desktop/FormAuto_Hub/smoke-ai-settings.png', fullPage: true });
console.log('✅ Screenshot: smoke-ai-settings.png');

// Step 4: Form automation page with AI modes
console.log('\n=== Form Automation with AI ===');
await page.goto('http://localhost:3000/dashboard/forms', { timeout: 15000 });
await page.waitForTimeout(3000);

// Count buttons
const buttons = await page.eval('button', els => els.map(e => e.textContent?.trim()).filter(Boolean));
console.log('Buttons found:', buttons.length);
const aiButtons = buttons.filter(t => t && (t.includes('Option') || t.includes('AI') || t.includes('x2') || t.includes('x3')));
console.log('AI-related buttons:', aiButtons);

await browser.close();
console.log('\n✅ Browser smoke complete');
