import { expect, test, type Page } from "@playwright/test";

// Browser regression tests use API fixtures; they never submit to Google Forms.
const projectId = "automation-fixture";
const analysis = {
  projectId, name: "Khảo sát nội bộ", formTitle: "Khảo sát trải nghiệm",
  formUrl: "https://docs.google.com/forms/d/e/fixture/viewform",
  status: "Analyzed", createdAt: "2026-10-07T00:00:00Z",
  questions: [{ id: "q1", projectId, label: "Bạn có hài lòng?", entryId: "entry.1", questionType: "MultipleChoice", options: ["Có", "Không"], required: true, orderIndex: 0 }]
};
const preview = (id: string) => ({
  id, projectId, status: "Previewed", source: "Rule", isReadOnly: false,
  previewText: "Có", createdAt: analysis.createdAt,
  answers: [{ questionId: "q1", entryId: "entry.1", label: "Bạn có hài lòng?", questionType: "MultipleChoice", values: ["Có"] }]
});

async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: "automation-user", email: "fixture@example.invalid", fullName: "UI Fixture", role: "User",
    accessToken: "fixture", refreshToken: "fixture",
    accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
  })));
  let directCount = 0;
  let failAnalysis = false;
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/forms/analyze") {
      await route.fulfill(failAnalysis ? { status: 400, json: { message: "Không phân tích được form" } } : { json: analysis });
    } else if (path.endsWith("/submissions/send-rules-direct")) {
      directCount = request.postDataJSON().count;
      await route.fulfill({ json: { id: "direct-job", projectId, status: "Completed", total: directCount, successCount: directCount, failedCount: 0, createdAt: analysis.createdAt, logs: [] } });
    } else if (path.endsWith("/responses")) {
      const ids = url.searchParams.getAll("ids");
      await route.fulfill({ json: { items: ids.map(preview) } });
    } else if (path.endsWith("/submissions/send")) {
      const payload = request.postDataJSON();
      expect(payload.confirmed).toBe(true);
      await route.fulfill({ json: { id: "job", projectId, status: "Completed", total: payload.responseIds.length, successCount: payload.responseIds.length, failedCount: 0, createdAt: analysis.createdAt, logs: [] } });
    } else {
      await route.fulfill({ json: path === "/api/packages" ? [] : path === "/api/dashboard/summary" ? { currentCreditBalance: 20 } : {} });
    }
  });
  await page.goto("/dashboard/forms");
  return { directCount: () => directCount, failAnalysis: () => { failAnalysis = true; } };
}

async function analyzeAndSend(page: Page, count = 1) {
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Có", exact: true })).toBeVisible();
  await page.locator('input[type="number"]').fill(String(count));
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kết quả gửi", exact: true })).toBeVisible();
}

test("rules sends the currently displayed configuration without a preview confirmation step", async ({ page }) => {
  const api = await setup(page);
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await page.getByRole("button", { name: "Không", exact: true }).click();
  await page.locator('input[type="number"]').fill("2");
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kết quả gửi", exact: true })).toBeVisible();
  expect(api.directCount()).toBe(2);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("changing form URL clears previous analysis even when the next analysis fails", async ({ page }) => {
  const api = await setup(page);
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  api.failAnalysis();
  await page.getByLabel("Link Google Form").fill("https://docs.google.com/forms/d/e/invalid/viewform");
  await expect(page.getByRole("button", { name: "Có", exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toHaveCount(0);
});

test("AI partial results without credit shortage report actual previews and cost", async ({ page }) => {
  await setup(page);
  await page.route("**/ai-prompt-profile?*", route => route.fulfill({ status: 404 }));
  await page.route("**/ai-responses/generate", route => route.fulfill({ json: {
    runId: "ai-run", status: "Partial", requestedCount: 3, generatedCount: 1,
    multiplier: 2, creditsUsed: 2, missingCredits: 0, balanceAfter: 18, generatedPreviewIds: ["ai-1"]
  } }));
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await page.getByRole("button", { name: /AI mặc định.*x2/ }).click();
  await page.locator('input[type="number"]').fill("3");
  await page.getByRole("button", { name: /Tạo.*preview|Tạo.*xem trước/i }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo 1/3" })).toContainText("Đã trừ 2 credit");
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo 1/3" })).toContainText("Chưa tạo đủ");
  await expect(page.getByRole("button", { name: "Nạp thêm credit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toBeEnabled();
});

test("desktop and mobile workflow render without overflow or drawer overlap", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.url().includes("/_next/") && response.status() >= 400) errors.push(response.url()); });
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await analyzeAndSend(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${process.env.TEMP ?? "/tmp"}/formauto-automation-desktop.png`, fullPage: true });
  await expect(page.getByRole("navigation", { name: "Các bước tự động hóa" }).locator('[aria-current="step"]')).toHaveText("5Kết quả");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    const menu = page.getByRole("complementary", { name: "Menu di động" });
    await expect(menu).toBeVisible();
    const navigation = menu.getByRole("link", { name: "Tự động hóa biểu mẫu", exact: true });
    await expect(navigation).toBeInViewport();
    expect(await navigation.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    await navigation.click();
    await expect(menu).toHaveCount(0);
    if (width === 390) await page.screenshot({ path: `${process.env.TEMP ?? "/tmp"}/formauto-automation-mobile.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test("sticky generation actions remain clickable above expanded question editors", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/forms/analyze", route => route.fulfill({ json: {
    ...analysis,
    questions: Array.from({ length: 4 }, (_, index) => ({ ...analysis.questions[0], id: `q${index}`, orderIndex: index }))
  } }));
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  const action = page.getByRole("button", { name: "Tạo và gửi ngay", exact: true });
  await expect(action).toBeEnabled();
  for (const top of [300, 600, 900]) {
    await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), top);
    const hitTest = await action.evaluate(button => {
      const panel = button.parentElement!;
      const rect = panel.getBoundingClientRect();
      let checked = 0;
      let obscured = 0;
      for (let y = Math.max(80, rect.top + 5); y < Math.min(innerHeight - 5, rect.bottom); y += 15) {
        for (let x = rect.left + 8; x < rect.right - 8; x += 30) {
          checked++;
          if (!panel.contains(document.elementFromPoint(x, y))) obscured++;
        }
      }
      return { checked, obscured };
    });
    expect(hitTest.checked).toBeGreaterThan(0);
    expect(hitTest.obscured).toBe(0);
  }
});
