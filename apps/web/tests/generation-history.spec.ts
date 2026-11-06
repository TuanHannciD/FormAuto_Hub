import { test, expect, type Page } from "@playwright/test";

const projectId = "11111111-1111-1111-1111-111111111111";
const batchId = "22222222-2222-2222-2222-222222222222";
const outcomes = { successfulAttempts: 2, rejectedAttempts: 1, unknownAttempts: 0, neverAttemptedResponses: 98 };
const credits = { balance: 120, reserved: 20, available: 100 };
const run = { batchId, projectId, formName: "Khảo sát nhân sự", mode: "ai-default", createdAt: "2026-11-05T01:00:00Z", requestedCount: 100, generatedCount: 100, generationCredits: 100, pricingPolicy: "SeparatedV1", outcomes };
const responses = Array.from({ length: 100 }, (_, i) => ({ ordinal: i, response: {
  id: `33333333-3333-3333-3333-${String(i + 1).padStart(12, "0")}`, projectId, status: "Previewed", source: "AI", isReadOnly: true,
  previewText: `Nội dung ${i + 1}`, createdAt: run.createdAt,
  answers: [{ questionId: "q1", entryId: "entry.1", label: "Ý kiến", questionType: "ShortText", values: [`Nội dung ${i + 1}`] }]
}, prepaidFirstSuccessAvailable: false, sendBlocked: false, blockReason: null, outcomes }));

async function setup(page: Page, options: { blocked?: boolean; sendCode?: string; unknown?: boolean; expired?: boolean; listError?: boolean } = {}) {
  await page.addInitScript(() => { if (!localStorage.getItem("formauto.auth.session")) localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "history-user", email: "history@example.invalid", fullName: "History Fixture", role: "User", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })); });
  const posts: unknown[] = []; let statusReads = 0;
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url()); const path = url.pathname;
    const reply = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/dashboard/summary") return reply({ currentCreditBalance: 120, reservedCreditBalance: 20, availableCreditBalance: 100, totalCreditsDeposited: 120, totalCreditsUsed: 0, pendingTopupOrders: 0, recentTopupOrders: [], recentUsageLogs: [] });
    if (path === "/api/generation-history") {
      if (options.listError) return reply({}, 500);
      const p = Number(url.searchParams.get("page") ?? 1);
      return reply({ items: Array.from({ length: 10 }, (_, i) => ({ ...run, batchId: i === 0 ? batchId : `22222222-2222-2222-2222-${String(p * 10 + i).padStart(12, "0")}`, formName: `Khảo sát nhân sự ${(p - 1) * 10 + i + 1}` })), page: p, pageSize: 10, totalItems: 20, totalPages: 2 });
    }
    if (path.startsWith("/api/generation-history/")) return options.expired ? reply({}, 404) : reply({ run, formUrl: "https://docs.google.com/forms/d/e/fixture/viewform", observation: { questions: [], completeness: "Partial", receiptCapability: "Unknown" }, responses: responses.map(item => ({ ...item, sendBlocked: Boolean(options.blocked), blockReason: options.blocked ? "FormEvidenceUnavailable" : null })), credits });
    if (path.endsWith("/submissions/send")) {
      const body = route.request().postDataJSON(); posts.push(body);
      if (options.sendCode) return reply({ code: options.sendCode }, 409);
      return reply({ id: body.commandId, commandId: body.commandId, contractVersion: 2, projectId, total: body.responseIds.length, successCount: options.unknown ? 0 : body.responseIds.length, failedCount: 0, unknownCount: options.unknown ? 1 : 0, status: options.unknown ? "Failed" : "Completed", createdAt: run.createdAt, runnerAcknowledgedAt: run.createdAt, logs: [], items: [], fees: { maximumSendCredits: body.responseIds.length, heldCredits: options.unknown ? 1 : 0, settledCredits: options.unknown ? 0 : body.responseIds.length, releasedCredits: 0, unknownCount: options.unknown ? 1 : 0, notDispatchedCount: 0, runnerAcknowledged: true, credits } });
    }
    if (path.includes("/submissions/jobs/")) { statusReads++; return reply({}, 404); }
    return reply({});
  });
  return { posts, statusReads: () => statusReads };
}

for (const code of ["HistoryExpired", "FormIncompatible", "FormEvidenceUnavailable", "OutcomeUnresolved", "ActiveSubmissionJob", "ClientUpgradeRequired", "CommandConflict"]) test(`history fence ${code} never retries a mutation`, async ({ page }) => {
  const fixture = await setup(page, { sendCode: code }); await openRun(page);
  await page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true }).check();
  await page.getByRole("button", { name: "Xem lại và gửi" }).click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận gửi" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /hết hạn|Cấu trúc|bằng chứng|chưa xác định|chưa giải quyết|hợp đồng cũ/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem lại và gửi" })).toBeDisabled();
  expect(fixture.posts).toHaveLength(1);
});

test("detail expired, list error and empty states remain recoverable without send", async ({ page }) => {
  await setup(page, { expired: true }); await page.goto("/dashboard/forms/history");
  await page.getByRole("button", { name: "Xem lượt tạo", exact: true }).first().click();
  await expect(page.getByRole("alert").filter({ hasText: "hết hạn" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem lại và gửi" })).toHaveCount(0);
  await page.route("**/api/generation-history?*", route => route.fulfill({ status: 500, json: {} }));
  await page.getByRole("button", { name: "Tải lại lịch sử" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Không tải được dữ liệu" })).toBeVisible();
  await page.route("**/api/generation-history?*", route => route.fulfill({ json: { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } }));
  await page.getByRole("button", { name: "Tải lại lịch sử" }).click();
  await expect(page.getByText("Chưa có lượt tạo nào")).toBeVisible();
});

test("selection resets across runs/pages and logout/new session rejects late old-user detail", async ({ page }) => {
  await setup(page); await openRun(page);
  await page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true }).check();
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  await page.getByRole("button", { name: "Xem lượt tạo", exact: true }).first().click();
  await expect(page.getByText("Đã chọn 0/100 câu trả lời")).toBeVisible();
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  let release: (() => void) | undefined;
  await page.route("**/api/generation-history/22222222*", async route => {
    await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ json: { run: { ...run, formName: "PRIVATE_OLD_USER" }, formUrl: "https://docs.google.com", observation: { questions: [], completeness: "Partial", receiptCapability: "Unknown" }, responses, credits } });
  });
  await page.getByRole("button", { name: "Xem lượt tạo", exact: true }).first().click();
  await expect.poll(() => Boolean(release)).toBe(true);
  await page.evaluate(() => { const prior = JSON.parse(localStorage.getItem("formauto.auth.session")!); localStorage.setItem("formauto.auth.session", JSON.stringify({ ...prior, userId: "new-history-user", fullName: "New User" })); window.dispatchEvent(new Event("formauto-auth-session-changed")); });
  release!();
  await expect(page.getByText("PRIVATE_OLD_USER")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Chi tiết lượt tạo" })).toHaveCount(0);
  await expect(page.getByText("New User", { exact: true }).first()).toBeVisible();
});

test("keyboard focus stays in confirmation, Escape closes and no hydration/chunk errors", async ({ page }) => {
  const errors: string[] = []; const failedChunks: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.url().includes("/_next/static/") && response.status() !== 200) failedChunks.push(`${response.status()} ${response.url()}`); });
  await setup(page); await openRun(page);
  await page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true }).check();
  await page.getByRole("button", { name: "Xem lại và gửi" }).click();
  await expect(page.getByRole("dialog").getByRole("checkbox")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("dialog").getByRole("button", { name: "Quay lại", exact: true })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]); expect(failedChunks).toEqual([]);
});

async function openRun(page: Page) {
  await page.goto("/dashboard/forms/history");
  await page.getByRole("button", { name: "Xem lượt tạo", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Chi tiết lượt tạo" })).toBeVisible();
}

test("20 account runs paginate and detail100 preview/selection shows exact fees", async ({ page }) => {
  await setup(page); await page.goto("/dashboard/forms/history");
  await expect(page.getByRole("heading", { name: "Lịch sử tạo câu trả lời" })).toBeVisible();
  await expect(page.getByText("Trang 1/2 · 20 kết quả")).toBeVisible();
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  await expect(page.getByText("Trang 2/2 · 20 kết quả")).toBeVisible();
  await page.getByRole("button", { name: "Xem lượt tạo", exact: true }).first().click();
  await expect(page.getByText("Nội dung 100", { exact: true }).first()).toBeVisible();
  await page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true }).check();
  await expect(page.getByText("Phí gửi tối đa: 1 credit", { exact: true })).toBeVisible();
  await expect(page.getByText("Phí tạo đã trả: 100 credit", { exact: true })).toBeVisible();
});

test("explicit duplicate confirmation creates one v2 command and no click replay", async ({ page }) => {
  const fixture = await setup(page); await openRun(page);
  await page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true }).check();
  await page.getByRole("button", { name: "Xem lại và gửi" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Gửi lại có thể tạo trùng dữ liệu/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Xác nhận gửi" })).toBeDisabled();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Xác nhận gửi" }).click();
  await expect(page.getByText(/Đã gửi thành công 1/)).toBeVisible();
  expect(fixture.posts).toHaveLength(1);
  expect(fixture.posts[0]).toMatchObject({ contractVersion: 2, batchId, confirmed: true, duplicateWarningAccepted: true, responseIds: [responses[0].response.id] });
  expect((fixture.posts[0] as { commandId: string }).commandId).toMatch(/^[a-f0-9-]{36}$/);
});

test("real evidence block disables unsafe selection and expired detail stays honest", async ({ page }) => {
  await setup(page, { blocked: true }); await openRun(page);
  await expect(page.getByText(/Chưa đủ bằng chứng/).first()).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Xem lại và gửi" })).toBeDisabled();
});

test("unknown keeps hold and blocks a new send without automatic retries", async ({ page }) => {
  const fixture = await setup(page, { unknown: true }); await openRun(page);
  await page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true }).check();
  await page.getByRole("button", { name: "Xem lại và gửi" }).click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận gửi" }).click();
  await expect(page.getByText(/Kết quả gửi chưa xác định/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem lại và gửi" })).toBeDisabled();
  await page.reload(); await expect(page.getByRole("button", { name: "Kiểm tra kết quả gửi" })).toBeVisible();
  expect(fixture.posts).toHaveLength(1);
});

for (const width of [1366, 390, 320]) test(`history fits viewport ${width} with keyboard confirmation`, async ({ page }) => {
  await page.setViewportSize({ width, height: 850 }); await setup(page); await openRun(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: test.info().outputPath(`history-${width}.png`), fullPage: true });
});


test("transport uncertainty reload recovers the exact command through GET only", async ({ page }) => {
  await setup(page);
  const sent: { commandId: string }[] = [];
  let reads = 0;
  await page.route("**/submissions/send", async route => { sent.push(route.request().postDataJSON()); await route.abort("failed"); });
  await page.route("**/submissions/jobs/*", route => {
    reads++;
    expect(new URL(route.request().url()).pathname).toContain(sent[0].commandId);
    expect(route.request().method()).toBe("GET");
    return route.fulfill({ json: { id: sent[0].commandId, commandId: sent[0].commandId, contractVersion: 2, projectId, status: "Completed", total: 1, successCount: 1, failedCount: 0, runnerAcknowledgedAt: run.createdAt, createdAt: run.createdAt, logs: [], items: [] } });
  });
  await openRun(page);
  await page.getByRole("checkbox", { name: "Chọn câu trả lời 1", exact: true }).check();
  await page.getByRole("button", { name: "Xem lại và gửi" }).click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận gửi" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Kết quả gửi chưa xác định" })).toBeVisible();
  expect(reads).toBe(0);
  await page.reload();
  await page.getByRole("button", { name: "Kiểm tra kết quả gửi" }).click();
  await expect(page.getByText(/Đã gửi thành công 1/)).toBeVisible();
  expect(sent).toHaveLength(1); expect(reads).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("formauto.historyCommand.history-user"))).toBeNull();
});

test("multiple pending history and AI commands remain independently reachable after reload", async ({ page }) => {
  const fixture = await setup(page);
  const first = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", second = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const otherProject = "99999999-9999-9999-9999-999999999999";
  await page.addInitScript(({ first, second, projectId, otherProject }) => {
    if (localStorage.getItem("fixture.pendingCommandsSeeded")) return;
    localStorage.setItem("fixture.pendingCommandsSeeded", "true");
    for (const [commandId, project] of [[first, projectId], [second, otherProject]]) {
      localStorage.setItem(`formauto.historyCommand.history-user.command.${commandId}`, JSON.stringify({ contractVersion: 2, userId: "history-user", projectId: project, commandId, batchId: null }));
    }
  }, { first, second, projectId, otherProject });
  const reads: string[] = [];
  await page.route("**/submissions/jobs/*", route => {
    const id = new URL(route.request().url()).pathname.split("/").pop()!;
    reads.push(id); expect(route.request().method()).toBe("GET");
    return route.fulfill({ json: { id, commandId: id, contractVersion: 2, projectId: id === first ? projectId : otherProject, status: id === first ? "Failed" : "Completed", total: 1, successCount: id === first ? 0 : 1, failedCount: 0, unknownCount: id === first ? 1 : 0, runnerAcknowledgedAt: run.createdAt, createdAt: run.createdAt, logs: [], items: [] } });
  });
  await page.goto("/dashboard/forms/history");
  await page.getByRole("button", { name: `Kiểm tra kết quả gửi ${first}`, exact: true }).click();
  await expect(page.getByText(/Kết quả gửi chưa xác định/).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: `Kiểm tra kết quả gửi ${first}`, exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 850 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: test.info().outputPath("pending-queue-390.png") });
  await page.getByRole("button", { name: `Kiểm tra kết quả gửi ${second}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Kiểm tra kết quả gửi ${second}`, exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `Kiểm tra kết quả gửi ${first}`, exact: true })).toBeVisible();
  await page.goto("/dashboard/forms");
  await expect(page.getByRole("link", { name: "Xem tất cả mã lệnh đang chờ" })).toBeVisible();
  await expect(page.getByText(`Mã lệnh: ${first}`, { exact: true })).toBeVisible();
  expect(reads).toEqual([first, second]); expect(fixture.posts).toHaveLength(0);
  await page.evaluate(() => {
    const old = JSON.parse(localStorage.getItem("formauto.auth.session")!);
    localStorage.setItem("formauto.auth.session", JSON.stringify({ ...old, userId: "other-owner", fullName: "Other Owner" }));
    window.dispatchEvent(new Event("formauto-auth-session-changed"));
  });
  await expect(page.getByText(`Mã lệnh: ${first}`, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Xem tất cả mã lệnh đang chờ" })).toHaveCount(0);
});
