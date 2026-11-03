import { expect, test, type Page, type Route } from "@playwright/test";

// These browser fixtures never contact Google or a paid AI provider.
const projectId = "direct-rule-project";
const createdAt = "2026-11-01T00:00:00Z";
const analysis = {
  projectId,
  name: "Khảo sát nội bộ",
  formTitle: "Khảo sát trực tiếp",
  formUrl: "https://docs.google.com/forms/d/e/direct-fixture/viewform",
  status: "Analyzed",
  createdAt,
  questions: [{
    id: "q1",
    projectId,
    label: "Bạn có hài lòng?",
    entryId: "entry.1",
    questionType: "MultipleChoice",
    options: ["Có", "Không"],
    required: true,
    orderIndex: 0
  }]
};

const preview = {
  id: "ai-preview-1",
  projectId,
  status: "Previewed",
  source: "AiDefault",
  isReadOnly: true,
  previewText: "Có",
  createdAt,
  answers: [{ questionId: "q1", entryId: "entry.1", label: "Bạn có hài lòng?", questionType: "MultipleChoice", values: ["Có"] }]
};

function job(total: number, id = "direct-job") {
  return {
    id,
    projectId,
    status: "Completed",
    total,
    successCount: total,
    failedCount: 0,
    createdAt,
    logs: Array.from({ length: total }, (_, index) => ({
      id: `log-${index}`,
      responseId: `persisted-response-${index}`,
      status: "Success",
      errorMessage: "",
      submittedAt: createdAt
    }))
  };
}

async function addSession(page: Page) {
  await page.addInitScript(() => { if (!localStorage.getItem("formauto.auth.session")) localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: "direct-rule-user",
    email: "direct@example.invalid",
    fullName: "Direct Fixture",
    role: "User",
    accessToken: "fixture",
    refreshToken: "fixture",
    accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString()
  })); });
}

async function analyze(page: Page) {
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Có", exact: true })).toBeVisible();
}

async function baseRoutes(page: Page, onApi?: (route: Route, path: string) => Promise<boolean>) {
  let balanceReads = 0;
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (onApi && await onApi(route, path)) return;
    if (path === "/api/forms/analyze") return route.fulfill({ json: analysis });
    if (path === "/api/dashboard/summary") {
      balanceReads++;
      return route.fulfill({ json: { currentCreditBalance: balanceReads === 1 ? 20 : 17 } });
    }
    if (path.endsWith("/answer-rules")) return route.fulfill({ json: {} });
    if (path === "/api/packages") return route.fulfill({ json: [] });
    return route.fulfill({ json: {} });
  });
  return { balanceReads: () => balanceReads };
}

test("rules uses one direct action without preview, checkbox, or common submission payload", async ({ page }) => {
  await addSession(page);
  let directCalls = 0;
  let previewCalls = 0;
  let commonSendCalls = 0;
  let directPayload: Record<string, unknown> | null = null;
  const api = await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/responses/generate")) {
      previewCalls++;
      await route.fulfill({ json: {} });
      return true;
    }
    if (path.endsWith("/submissions/send")) {
      commonSendCalls++;
      await route.fulfill({ json: job(1, "common-job") });
      return true;
    }
    if (path.endsWith("/submissions/send-rules-direct")) {
      directCalls++;
      directPayload = route.request().postDataJSON();
      await new Promise(resolve => setTimeout(resolve, 80));
      await route.fulfill({ json: job(1) });
      return true;
    }
    return false;
  });

  await page.goto("/dashboard/forms");
  await analyze(page);
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: "trước khi tạo và gửi" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Tạo và gửi theo quy tắc" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  const action = page.getByRole("button", { name: "Tạo và gửi ngay", exact: true });
  await action.dblclick();

  await expect(page.getByRole("heading", { name: "Kết quả gửi", exact: false })).toBeVisible();
  expect(directCalls).toBe(1);
  expect(previewCalls).toBe(0);
  expect(commonSendCalls).toBe(0);
  expect(directPayload).toEqual({ commandId: expect.stringMatching(/^[0-9a-f-]{36}$/i), count: 1 });
  await expect.poll(api.balanceReads).toBeGreaterThanOrEqual(2);
});

test("unknown transport and refresh check the same command without saving rules again", async ({ page }) => {
  await addSession(page);
  const commandIds: string[] = [];
  let ruleWrites = 0;
  let directCalls = 0;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/answer-rules")) {
      ruleWrites++;
      await route.fulfill({ json: {} });
      return true;
    }
    if (path.endsWith("/submissions/send-rules-direct")) {
      directCalls++;
      commandIds.push(route.request().postDataJSON().commandId);
      if (directCalls === 1) await route.abort("connectionreset");
      else await route.fulfill({ json: job(1, "recovered-job") });
      return true;
    }
    return false;
  });

  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "chưa xác định" })).toBeVisible();
  expect(ruleWrites).toBe(1);

  await page.reload();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("formauto.directRuleCommand.direct-rule-user") ?? "null"));
  expect(stored).toMatchObject({ projectId, count: 1, commandId: commandIds[0] });
  await page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true }).click();
  await expect(page.getByText("recovered-job", { exact: false })).toBeVisible();
  expect(commandIds).toEqual([commandIds[0], commandIds[0]]);
  expect(ruleWrites).toBe(1);
});

test("503 retains the command and retry reuses it without saving rules again", async ({ page }) => {
  await addSession(page);
  const commandIds: string[] = [];
  let ruleWrites = 0;
  let directCalls = 0;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/answer-rules")) {
      ruleWrites++;
      await route.fulfill({ json: {} });
      return true;
    }
    if (path.endsWith("/submissions/send-rules-direct")) {
      directCalls++;
      commandIds.push(route.request().postDataJSON().commandId);
      if (directCalls === 1) await route.fulfill({ status: 503, json: {} });
      else await route.fulfill({ json: job(1, "recovered-after-503") });
      return true;
    }
    return false;
  });

  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "chưa xác định" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("formauto.directRuleCommand.direct-rule-user") ?? "null")?.commandId)).toBe(commandIds[0]);
  await page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true }).click();
  await expect(page.getByText("recovered-after-503", { exact: false })).toBeVisible();
  expect(commandIds).toEqual([commandIds[0], commandIds[0]]);
  expect(ruleWrites).toBe(1);
});

test("post-admission 400 reconciles the existing job by command ID", async ({ page }) => {
  await addSession(page);
  let ruleWrites = 0;
  let postCalls = 0;
  let getCalls = 0;
  let commandId = "";
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/answer-rules")) {
      ruleWrites++;
      await route.fulfill({ json: {} });
      return true;
    }
    if (path.endsWith("/submissions/send-rules-direct")) {
      postCalls++;
      commandId = route.request().postDataJSON().commandId;
      await route.fulfill({ status: 400, json: {} });
      return true;
    }
    if (path.endsWith(`/submissions/jobs/${commandId}`)) {
      getCalls++;
      await route.fulfill({ json: job(1, commandId) });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect.poll(() => postCalls).toBe(1);
  await expect.poll(() => getCalls).toBe(1);
  await expect(page.getByText(commandId, { exact: false })).toBeVisible();
  expect({ ruleWrites, postCalls, getCalls }).toEqual({ ruleWrites: 1, postCalls: 1, getCalls: 1 });
  expect(await page.evaluate(() => localStorage.getItem("formauto.directRuleCommand.direct-rule-user"))).toBeNull();
});

test("pre-admission 400 clears only after same-command GET confirms 404", async ({ page }) => {
  await addSession(page);
  let getCalls = 0;
  let postCalls = 0;
  let commandId = "";
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      postCalls++;
      commandId = route.request().postDataJSON().commandId;
      await route.fulfill({ status: 400, json: {} });
      return true;
    }
    if (path.endsWith(`/submissions/jobs/${commandId}`)) {
      getCalls++;
      await route.fulfill({ status: 404, json: {} });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect.poll(() => postCalls).toBe(1);
  await expect.poll(() => getCalls).toBe(1);
  await expect(page.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toBeEnabled();
  expect(getCalls).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("formauto.directRuleCommand.direct-rule-user"))).toBeNull();
});

test("failed reconciliation probe keeps the original command fail-closed", async ({ page }) => {
  await addSession(page);
  let commandId = "";
  let postCalls = 0;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      postCalls++;
      commandId = route.request().postDataJSON().commandId;
      await route.fulfill({ status: 409, json: {} });
      return true;
    }
    if (path.endsWith(`/submissions/jobs/${commandId}`)) {
      await route.fulfill({ status: 503, json: {} });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect.poll(() => postCalls).toBe(1);
  await expect(page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("formauto.directRuleCommand.direct-rule-user") ?? "null")?.commandId)).toBe(commandId);
});

test("unexpected reconciliation job identity retains the original command", async ({ page }) => {
  await addSession(page);
  let commandId = "";
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      commandId = route.request().postDataJSON().commandId;
      await route.fulfill({ status: 400, json: {} });
      return true;
    }
    if (path.endsWith(`/submissions/jobs/${commandId}`)) {
      await route.fulfill({ json: job(1, "different-command") });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("formauto.directRuleCommand.direct-rule-user") ?? "null")?.commandId)).toBe(commandId);
});

test("session change during 400 response retains the original user's command without probing", async ({ page }) => {
  await addSession(page);
  let commandId = "";
  let getCalls = 0;
  let postCalls = 0;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      postCalls++;
      commandId = route.request().postDataJSON().commandId;
      await page.evaluate(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "changed-user", role: "User", accessToken: "changed", refreshToken: "changed", accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString() })));
      await route.fulfill({ status: 400, json: {} });
      return true;
    }
    if (path.includes("/submissions/jobs/")) {
      getCalls++;
      await route.fulfill({ status: 404, json: {} });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect.poll(() => postCalls).toBe(1);
  await expect(page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true })).toBeVisible();
  expect(getCalls).toBe(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("formauto.directRuleCommand.direct-rule-user") ?? "null")?.commandId)).toBe(commandId);
});

test("uncertain failed job retains the command and repeated checks cannot create a new one", async ({ page }) => {
  await addSession(page);
  const commandIds: string[] = [];
  let ruleWrites = 0;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/answer-rules")) {
      ruleWrites++;
      await route.fulfill({ json: {} });
      return true;
    }
    if (path.endsWith("/submissions/send-rules-direct")) {
      const commandId = route.request().postDataJSON().commandId;
      commandIds.push(commandId);
      await route.fulfill({ json: {
        ...job(1, "uncertain-failed-job"),
        status: "Failed",
        successCount: 0,
        failedCount: 1,
        logs: [{ id: "uncertain-log", responseId: "response-unknown", status: "Failed", errorMessage: "Kết quả gửi chưa xác định. Không tự động gửi lại; hãy kiểm tra kết quả trên Google Forms.", submittedAt: createdAt }]
      } });
      return true;
    }
    return false;
  });

  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Không", exact: true }).click({ force: true });
  expect(ruleWrites).toBe(1);
  await page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true }).click();
  expect(commandIds).toEqual([commandIds[0], commandIds[0]]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("formauto.directRuleCommand.direct-rule-user") ?? "null")?.commandId)).toBe(commandIds[0]);
  expect(ruleWrites).toBe(1);
});

test("account switching preserves each user's unresolved command", async ({ page }) => {
  await addSession(page);
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      await route.abort("connectionreset");
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true })).toBeVisible();
  const commandA = await page.evaluate(() => localStorage.getItem("formauto.directRuleCommand.direct-rule-user"));
  expect(commandA).not.toBeNull();

  await page.evaluate(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "user-b", role: "User", accessToken: "fixture-b", refreshToken: "fixture-b", accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString() })));
  await page.reload();
  await expect(page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("formauto.directRuleCommand.direct-rule-user"))).toBe(commandA);

  await page.evaluate(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "direct-rule-user", role: "User", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString() })));
  await page.reload();
  await expect(page.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true })).toBeVisible();
});

test("storage synchronization locks a second tab for the same user", async ({ page, context }) => {
  await addSession(page);
  const second = await context.newPage();
  await addSession(second);
  for (const target of [page, second]) await baseRoutes(target, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      await route.abort("connectionreset");
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await second.goto("/dashboard/forms");
  await analyze(page);
  await analyze(second);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(second.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toBeDisabled();
  await expect(second.getByRole("button", { name: "Kiểm tra kết quả gửi", exact: true })).toBeVisible();
  await second.close();
});

test("missing Web Locks fails closed before saving rules or creating a command", async ({ page }) => {
  await addSession(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { configurable: true, value: undefined }));
  let ruleWrites = 0;
  let directCalls = 0;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/answer-rules")) {
      ruleWrites++;
      await route.fulfill({ json: {} });
      return true;
    }
    if (path.endsWith("/submissions/send-rules-direct")) {
      directCalls++;
      await route.fulfill({ json: job(1) });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await expect(page.getByRole("alert").filter({ hasText: "khóa an toàn giữa các tab" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toBeDisabled();
  expect(ruleWrites).toBe(0);
  expect(directCalls).toBe(0);
});

test("terminal completion only clears the command it resolved", async ({ page }) => {
  await addSession(page);
  let release: (() => void) | undefined;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ json: job(1, "older-terminal-job") });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click({ noWaitAfter: true });
  await expect.poll(() => Boolean(release)).toBe(true);
  const newer = { projectId: "other-project", commandId: "22222222-2222-4222-8222-222222222222", count: 7, userId: "direct-rule-user", createdAt: new Date().toISOString() };
  await page.evaluate(value => localStorage.setItem("formauto.directRuleCommand.direct-rule-user", JSON.stringify(value)), newer);
  release!();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("formauto.directRuleCommand.direct-rule-user") ?? "null")?.commandId)).toBe(newer.commandId);
});

test("partial direct result reports the sent subset and missing count", async ({ page }) => {
  await addSession(page);
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      await route.fulfill({ json: job(2, "partial-job") });
      return true;
    }
    return false;
  });

  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.locator('input[type="number"]').fill("5");
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "2/5" })).toContainText("thiếu 3");
  await expect(page.getByRole("complementary", { name: "Tóm tắt lượt tạo" })).toContainText("17 credit khả dụng");
});

test("mixed result distinguishes generated attempts, successes, failures, and credit shortage", async ({ page }) => {
  await addSession(page);
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/submissions/send-rules-direct")) {
      await route.fulfill({ json: { ...job(4, "mixed-job"), successCount: 1, failedCount: 3 } });
      return true;
    }
    return false;
  });
  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.locator('input[type="number"]').fill("5");
  await page.getByRole("button", { name: "Tạo và gửi ngay", exact: true }).click();
  const result = page.getByRole("status").filter({ hasText: "4/5" });
  await expect(result).toContainText("Đã tạo");
  await expect(result).toContainText("thành công 1");
  await expect(result).toContainText("Thất bại 3");
  await expect(result).toContainText("thiếu 1");
  await expect(page.getByRole("complementary", { name: "Tóm tắt lượt tạo" })).toContainText("Đã tạo/nhận xử lý4");
  await expect(page.getByRole("complementary", { name: "Tóm tắt lượt tạo" })).toContainText("Gửi thành công1");
});

for (const mode of [
  { button: /AI mặc định.*x2/, backend: "Option2" },
  { button: /AI tùy chỉnh.*x3/, backend: "Option3" }
]) test(`AI ${mode.backend} still requires preview and confirmation before common send`, async ({ page }) => {
  await addSession(page);
  let commonPayload: Record<string, unknown> | null = null;
  let directCalls = 0;
  await baseRoutes(page, async (route, path) => {
    if (path.endsWith("/ai-prompt-profile") && route.request().method() === "GET") {
      await route.fulfill({ status: 404, json: {} });
      return true;
    }
    if (path.endsWith("/ai-prompt-profile") || path.includes("/ai-prompt-profile/questions/")) {
      await route.fulfill({ json: { questions: [] } });
      return true;
    }
    if (path.endsWith("/ai-responses/generate")) {
      expect(route.request().postDataJSON()).toMatchObject({ mode: mode.backend, count: 1 });
      await route.fulfill({ json: { runId: `run-${mode.backend}`, status: "Succeeded", requestedCount: 1, generatedCount: 1, multiplier: mode.backend === "Option2" ? 2 : 3, creditsUsed: mode.backend === "Option2" ? 2 : 3, missingCredits: 0, balanceAfter: 18, generatedPreviewIds: [preview.id] } });
      return true;
    }
    if (path.endsWith("/responses")) {
      await route.fulfill({ json: { items: [preview] } });
      return true;
    }
    if (path.endsWith("/submissions/send-rules-direct")) {
      directCalls++;
      await route.fulfill({ json: job(1) });
      return true;
    }
    if (path.endsWith("/submissions/send")) {
      commonPayload = route.request().postDataJSON();
      await route.fulfill({ json: job(1, `common-${mode.backend}`) });
      return true;
    }
    return false;
  });

  await page.goto("/dashboard/forms");
  await analyze(page);
  await page.getByRole("button", { name: mode.button }).click();
  await expect(page.getByRole("region", { name: "Tạo bản xem trước AI" })).toBeVisible();
  await page.getByRole("button", { name: /Tạo.*preview|Tạo.*xem trước/i }).click();
  await expect(page.getByRole("checkbox")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Xác nhận gửi 1 lượt", exact: true })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận gửi 1 lượt", exact: true }).click();
  expect(commonPayload).toEqual({ responseIds: [preview.id], confirmed: true });
  expect(directCalls).toBe(0);
});
