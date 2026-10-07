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

async function setup(page: Page, partial = false) {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: "automation-user", email: "fixture@example.invalid", fullName: "UI Fixture", role: "User",
    accessToken: "fixture", refreshToken: "fixture",
    accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
  })));
  let generationCalls = 0;
  let sentIds: string[] = [];
  let restoredIds: string[] = [];
  let failAnalysis = false;
  let releaseSend: (() => void) | undefined;
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/forms/analyze") {
      await route.fulfill(failAnalysis ? { status: 400, json: { message: "Không phân tích được form" } } : { json: analysis });
    } else if (path.endsWith("/responses/generate")) {
      const count = request.postDataJSON().count;
      generationCalls++;
      const generatedCount = partial && generationCalls === 1 ? 6 : count;
      const items = Array.from({ length: generatedCount }, (_, i) => preview(`${generationCalls}-${i}`));
      await route.fulfill({ json: { items, requestedCount: count, generatedCount, creditsUsed: generatedCount, missingCredits: count - generatedCount, balanceAfter: 20 } });
    } else if (path.endsWith("/responses")) {
      restoredIds = url.searchParams.getAll("ids");
      await route.fulfill({ json: { items: restoredIds.map(preview) } });
    } else if (path.endsWith("/submissions/send")) {
      const payload = request.postDataJSON();
      expect(payload.confirmed).toBe(true);
      sentIds = payload.responseIds;
      await new Promise<void>(resolve => { releaseSend = resolve; });
      await route.fulfill({ json: { id: "job", projectId, status: "Completed", total: sentIds.length, successCount: sentIds.length, failedCount: 0, createdAt: analysis.createdAt, logs: [] } });
    } else {
      await route.fulfill({ json: path === "/api/packages" ? [] : path === "/api/dashboard/summary" ? { currentCreditBalance: 20 } : {} });
    }
  });
  await page.goto("/dashboard/forms");
  return { sentIds: () => sentIds, restoredIds: () => restoredIds, failAnalysis: () => { failAnalysis = true; }, releaseSend: () => releaseSend?.() };
}

async function analyzeAndGenerate(page: Page, count = 1) {
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Có", exact: true })).toBeVisible();
  await page.locator('input[type="number"]').fill(String(count));
  await page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true }).click();
  await expect(page.getByRole("checkbox")).toBeEnabled();
}

test("configuration edits invalidate confirmation and block sending old previews", async ({ page }) => {
  const api = await setup(page);
  await analyzeAndGenerate(page);
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("button", { name: "Xác nhận gửi 1 lượt", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Không", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Cấu hình đã thay đổi" })).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByRole("checkbox")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Xác nhận gửi 1 lượt", exact: true })).toBeDisabled();
  expect(api.sentIds()).toEqual([]);
});

test("reload restores paid previews, then continuation sends all original and new IDs", async ({ page }) => {
  const api = await setup(page, true);
  await analyzeAndGenerate(page, 10);
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo 6/10" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox")).toBeEnabled();
  expect(api.restoredIds()).toEqual(Array.from({ length: 6 }, (_, i) => `1-${i}`));
  await page.getByRole("button", { name: "Tiếp tục tạo phần còn thiếu", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo 10/10" })).toContainText("Đã trừ 10 credit");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận gửi 10 lượt", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đang gửi các preview" })).toBeVisible();
  await expect(page.getByLabel("Link Google Form")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tạm dừng", exact: true })).toHaveCount(0);
  expect(api.sentIds()).toEqual([...Array.from({ length: 6 }, (_, i) => `1-${i}`), ...Array.from({ length: 4 }, (_, i) => `2-${i}`)]);
  api.releaseSend();
  await expect(page.getByRole("heading", { name: "5. Kết quả gửi", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lượt gửi đã kết thúc", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("formauto.formPreviewResume"))).toBeNull();
});

test("changing form URL clears previous analysis even when the next analysis fails", async ({ page }) => {
  const api = await setup(page);
  await analyzeAndGenerate(page);
  api.failAnalysis();
  await page.getByLabel("Link Google Form").fill("https://docs.google.com/forms/d/e/invalid/viewform");
  await expect(page.getByRole("button", { name: "Có", exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Không phân tích" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true })).toHaveCount(0);
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
  await analyzeAndGenerate(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${process.env.TEMP ?? "/tmp"}/formauto-automation-desktop.png`, fullPage: true });
  await expect(page.getByRole("navigation", { name: "Các bước tự động hóa" }).locator('[aria-current="step"]')).toHaveText("3Preview");
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
  const action = page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true });
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
