import { chromium } from '@playwright/test';

// A bounded UI smoke, not provider, submission, persistence or full-system verification.
export async function runLegacySmoke({ admin = false } = {}) {
  let browser;
  let stage = 'cấu hình';
  try {
    const { SMOKE_BASE_URL, SMOKE_EMAIL, SMOKE_PASSWORD } = process.env;
    if (!SMOKE_BASE_URL || !SMOKE_EMAIL || !SMOKE_PASSWORD) throw new Error('Missing smoke configuration');
    const target = new URL(SMOKE_BASE_URL);
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password
      || target.search || target.hash || target.pathname !== '/') throw new Error('Invalid smoke target');

    const health = { pageError: false, chunkFailure: false };
    stage = 'mở browser';
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', () => { health.pageError = true; });
    page.on('response', response => {
      if (response.url().includes('/_next/static/') && response.status() >= 400) health.chunkFailure = true;
    });
    page.on('requestfailed', request => {
      const assetPath = new URL(request.url()).pathname;
      // Navigation can cancel an in-flight font while the required UI has settled.
      // JS/CSS cancellation and actual font HTTP/network failures still fail smoke.
      const canceledFont = /\.(?:woff2?|ttf|otf)$/i.test(assetPath)
        && request.failure()?.errorText === 'net::ERR_ABORTED';
      if (assetPath.includes('/_next/static/') && !canceledFont) health.chunkFailure = true;
    });

    function requireRoute(expected) {
      const actual = new URL(page.url());
      if (actual.origin !== target.origin || actual.pathname !== expected) throw new Error('Unexpected route');
    }
    async function visit(route) {
      const response = await page.goto(new URL(route, target).href, { timeout: 15_000 });
      if (!response || response.status() < 200 || response.status() >= 300) throw new Error('Required route failed');
      requireRoute(route);
    }
    async function visible(role, name) {
      const element = page.getByRole(role, { name, exact: true });
      await element.waitFor({ state: 'visible', timeout: 15_000 });
      if (await element.count() !== 1) throw new Error('Required control missing or ambiguous');
    }

    stage = 'đăng nhập';
    await visit('/login');
    await page.locator('input[name="email"]').fill(SMOKE_EMAIL);
    await page.locator('input[name="password"]').fill(SMOKE_PASSWORD);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL(url => url.origin === target.origin && /^\/dashboard(?:\/|$)/.test(url.pathname), { timeout: 15_000 });
    const loggedInUrl = new URL(page.url());
    if (loggedInUrl.origin !== target.origin || !/^\/dashboard(?:\/|$)/.test(loggedInUrl.pathname)) throw new Error('Login did not settle');

    stage = 'giao diện biểu mẫu';
    await visit('/dashboard/forms');
    await visible('heading', 'Tự động hóa biểu mẫu');
    await visible('button', 'Phân tích biểu mẫu');
    // Do not click analysis/generation/submission controls or fill an external form URL.

    if (admin) {
      stage = 'giao diện cấu hình AI';
      await visit('/admin/ai-provider-settings');
      await visible('heading', 'Cấu hình nhà cung cấp AI');
    }
    stage = 'kiểm tra lỗi trang/chunk';
    if (health.pageError || health.chunkFailure) throw new Error('Required browser probe failed');
    console.log('Verified: smoke giới hạn — đăng nhập, route, heading, button; provider/AI/gửi form: Not run.');
  } catch {
    process.exitCode = 1;
    console.error(`Failed: smoke giới hạn tại bước ${stage}.`);
  } finally {
    if (browser) {
      try { await browser.close(); }
      catch {
        process.exitCode = 1;
        console.error('Failed: smoke giới hạn không xác nhận được đóng browser đã tạo.');
      }
    }
  }
}
