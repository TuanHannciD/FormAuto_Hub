import { expect, test, type Page } from "@playwright/test";

// Synthetic HTTP fixtures only. No Google, paid AI, or real form submission.
const projectId = "forms-error-fixture";
const stamp = "2026-10-30T00:00:00Z";
const question = { id: "q1", projectId, label: "Câu hỏi thử", entryId: "entry.1", questionType: "MultipleChoice", options: ["Có", "Không"], required: true, orderIndex: 0 };
const analysis = { projectId, name: "Lỗi giả lập", formTitle: "Biểu mẫu giả lập", formUrl: "https://docs.google.com/forms/d/e/error-fixture/viewform", status: "Analyzed", createdAt: stamp, questions: [question] };
const preview = (id: string) => ({ id, projectId, status: "Previewed", source: "Ai", isReadOnly: true, previewText: "Có", createdAt: stamp, answers: [{ questionId: "q1", entryId: "entry.1", label: question.label, questionType: "MultipleChoice", values: ["Có"] }] });
const profile = (globalPrompt = "Hướng dẫn đã lưu") => ({ id: "profile1", projectId, mode: "Option2", audienceJson: "{}", globalPrompt, createdAt: stamp, updatedAt: stamp, questions: [] });
const aiResult = { runId: "run-fixture-15", status: "Completed", requestedCount: 1, generatedCount: 1, multiplier: 2, creditsUsed: 2, missingCredits: 0, balanceAfter: 18, generatedPreviewIds: ["paid-preview-15"] };

async function setup(page: Page, questions = [question]) {
  const calls: { path: string; method: string; json: unknown }[] = [];
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "forms-error-user", email: "forms-error@example.invalid", fullName: "Error Fixture", role: "User", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    calls.push({ path, method: request.method(), json: request.postData() ? request.postDataJSON() : null });
    if (path === "/api/forms/analyze") await route.fulfill({ json: { ...analysis, questions } });
    else if (path.endsWith("/ai-prompt-profile") && request.method() === "GET") await route.fulfill({ json: profile() });
    else if (path.endsWith("/ai-responses/generate")) await route.fulfill({ json: aiResult });
    else if (path.endsWith("/responses/generate")) await route.fulfill({ json: { items: [preview("rule-preview")], requestedCount: 1, generatedCount: 1, creditsUsed: 1, missingCredits: 0, balanceAfter: 19 } });
    else if (path.endsWith("/responses")) await route.fulfill({ json: { items: new URL(request.url()).searchParams.getAll("ids").map(preview) } });
    else await route.fulfill({ json: path === "/api/packages" ? [] : path === "/api/dashboard/summary" ? { currentCreditBalance: 20 } : {} });
  });
  await page.goto("/dashboard/forms");
  await page.getByLabel("Link Google Form").fill(analysis.formUrl);
  await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
  await expect(page.getByText("Câu 1: Câu hỏi thử", { exact: true })).toBeVisible();
  return calls;
}
const chooseAi = (page: Page, custom = false) => page.getByRole("button", { name: custom ? /AI tùy chỉnh.*x3/ : /AI mặc định.*x2/ }).click();
const createAi = (page: Page) => page.getByRole("button", { name: "Lưu và tạo AI preview", exact: true });
const globalPrompt = (page: Page) => page.getByRole("textbox", { name: /^Prompt chung\s+\d+\/2000 ký tự$/ });

test("ERR014 failed profile read preserves edited prompt and blocks writes until read-only retry succeeds", async ({ page }) => {
  const calls = await setup(page);
  await chooseAi(page, true);
  await expect(globalPrompt(page)).toHaveValue("Hướng dẫn đã lưu");
  await globalPrompt(page).fill("Nội dung đang chỉnh sửa");
  let fail = true;
  await page.route("**/ai-prompt-profile?*", route => route.fulfill(fail ? { status: 503, json: { detail: "sk-secret-profile" } } : { json: profile("Hướng dẫn tải lại") }));
  await chooseAi(page);
  await expect(page.getByRole("alert").filter({ hasText: "Không tải được cấu hình AI" })).toBeVisible();
  await expect(globalPrompt(page)).toHaveValue("Nội dung đang chỉnh sửa");
  await expect(createAi(page)).toBeDisabled();
  expect(calls.filter(c => c.method === "PUT")).toHaveLength(0);
  fail = false;
  await page.getByRole("button", { name: "Tải lại cấu hình AI", exact: true }).click();
  await expect(globalPrompt(page)).toHaveValue("Hướng dẫn tải lại");
  await expect(createAi(page)).toBeEnabled();
  expect(calls.filter(c => c.method === "PUT")).toHaveLength(0);
  await expect(page.locator("body")).not.toContainText("sk-secret-profile");
});

test("ERR014 known absent profile permits a new profile with defaults", async ({ page }) => {
  await setup(page);
  await page.route("**/ai-prompt-profile?*", route => route.fulfill({ status: 404 }));
  await chooseAi(page);
  await expect(createAi(page)).toBeEnabled();
  await expect(globalPrompt(page)).toHaveValue(/Tạo câu trả lời/);
});

test("ERR014 pending profile read locks competing mode/project changes; next mode owns its profile", async ({ page }) => {
  const calls = await setup(page);
  let release: (() => void) | undefined;
  await page.route("**/ai-prompt-profile?*", async route => {
    if (new URL(route.request().url()).searchParams.get("mode") === "Option3") {
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ json: profile("Cấu hình A đến trễ") });
    } else await route.fulfill({ json: profile("Cấu hình B hiện tại") });
  });
  await chooseAi(page, true);
  await expect.poll(() => Boolean(release)).toBe(true);
  // Existing fieldset intentionally blocks overlapping reads. Exercise that protection
  // instead of forcing a click on a disabled mode and inventing a reachable UI race.
  await expect(page.getByRole("button", { name: /AI mặc định.*x2/ })).toBeDisabled();
  await expect(page.getByLabel("Link Google Form")).toBeDisabled();
  await expect(createAi(page)).toBeDisabled();
  expect(calls.filter(c => c.method === "PUT")).toHaveLength(0);
  const completed = page.waitForResponse(response => response.url().includes("ai-prompt-profile?mode=Option3"));
  release!();
  await completed;
  await expect(globalPrompt(page)).toHaveValue("Cấu hình A đến trễ");
  await chooseAi(page);
  await expect(globalPrompt(page)).toHaveValue("Cấu hình B hiện tại");
});

test("ERR015 confirmed AI result and IDs survive GET failure; retry only reads previews", async ({ page }) => {
  const calls = await setup(page);
  let reads = 0;
  let generations = 0;
  await page.route("**/ai-responses/generate", route => { generations++; return route.fulfill({ json: aiResult }); });
  await page.route("**/responses?*", route => { reads++; return route.fulfill(reads === 1 ? { status: 503 } : { json: { items: [preview("paid-preview-15")] } }); });
  await chooseAi(page);
  await createAi(page).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo 1/1" })).toContainText("Đã trừ 2 credit");
  await expect(page.getByText("Mã lượt AI: run-fixture-15", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "paid-preview-15" })).toBeVisible();
  await expect(createAi(page)).toBeDisabled();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Tải lại bản xem trước", exact: true }).click();
  await expect(page.getByRole("checkbox")).toBeEnabled();
  expect(generations).toBe(1);
  expect(reads).toBe(2);
  expect(calls.filter(c => c.method === "PUT")).toHaveLength(1);
});

test("ERR015 AI continuation retains the second confirmed run and cost when only its preview GET fails", async ({ page }) => {
  const calls = await setup(page);
  const posts: { method: string; json: { count: number; mode: string } }[] = [];
  const reads: string[][] = [];
  // A subsequent summary read represents an independently replenished test balance.
  await page.route("**/api/dashboard/summary", route => route.fulfill({ json: { currentCreditBalance: 2 } }));
  await page.route("**/ai-responses/generate", route => {
    posts.push({ method: route.request().method(), json: route.request().postDataJSON() });
    return route.fulfill({ json: posts.length === 1
      ? { ...aiResult, status: "Partial", requestedCount: 2, missingCredits: 2, balanceAfter: 0 }
      : { ...aiResult, runId: "run-continued-15", balanceAfter: 0, generatedPreviewIds: ["continued-preview-15"] } });
  });
  await page.route("**/responses?*", route => {
    const ids = new URL(route.request().url()).searchParams.getAll("ids");
    reads.push(ids);
    return route.fulfill(reads.length === 2 ? { status: 503 } : { json: { items: ids.map(preview) } });
  });
  await chooseAi(page);
  await page.locator('input[type="number"]').fill("2");
  await createAi(page).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo 1/2" })).toContainText("Đã trừ 2 credit");
  const continueButton = page.getByRole("button", { name: "Tiếp tục tạo phần còn thiếu", exact: true });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo 2/2" })).toContainText("Đã trừ 4 credit");
  await expect(page.getByText("Mã lượt AI: run-continued-15", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "continued-preview-15" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Tóm tắt lượt tạo" })).toContainText("0 credit khả dụng");
  await expect(page.getByRole("checkbox")).toBeDisabled();
  await expect(createAi(page)).toBeDisabled();
  const writesBeforeRetry = calls.filter(call => call.method === "PUT").length;
  await page.getByRole("button", { name: "Tải lại bản xem trước", exact: true }).click();
  await expect(page.getByRole("checkbox")).toBeEnabled();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Xác nhận gửi 2 lượt", exact: true })).toBeDisabled();
  expect(posts).toEqual([{ method: "POST", json: { mode: "Option2", count: 2 } }, { method: "POST", json: { mode: "Option2", count: 1 } }]);
  expect(reads).toEqual([["paid-preview-15"], ["continued-preview-15"], ["continued-preview-15"]]);
  expect(calls.filter(call => call.method === "PUT")).toHaveLength(writesBeforeRetry);
});

for (const reason of ["Dịch vụ AI đã hết thời gian chờ. Vui lòng thử lại sau. Không trừ credit.", "raw sk-secret-provider <script>private@example.invalid</script>"]) {
  test(`ERR011 generation shows safe failure and run ID: ${reason.startsWith("raw") ? "unknown" : "known"}`, async ({ page }) => {
    await setup(page);
    await page.route("**/ai-responses/generate", route => route.fulfill({ json: { ...aiResult, status: "Failed", generatedCount: 0, creditsUsed: 0, balanceAfter: 20, generatedPreviewIds: [], errorMessage: reason } }));
    await chooseAi(page);
    await createAi(page).click();
    await expect(page.getByText("Mã lượt AI: run-fixture-15", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: reason.startsWith("raw") ? "Không tạo được bản xem trước AI" : "Dịch vụ AI đã hết thời gian chờ" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("sk-secret-provider");
  });
}

test("ERR011 AI usage exposes safe reason and existing run ID without raw historical text", async ({ page }) => {
  await setup(page);
  await page.route("**/api/dashboard/ai-usage", route => route.fulfill({ json: {
    totalRuns: 2, successfulRuns: 0, failedRuns: 2, totalCreditsUsed: 0, totalPreviewsGenerated: 0, modeBreakdown: [], usageByDay: [],
    recentRuns: ["Dịch vụ AI đã hết thời gian chờ. Vui lòng thử lại sau. Không trừ credit.", "sk-secret-historical"].map((errorMessage, i) => ({ id: `recent-run-${i}`, mode: "FullAi", status: "Failed", provider: "fixture", model: "fixture", requestedCount: 1, generatedCount: 0, creditsUsed: 0, durationMs: 1, createdAt: stamp, projectName: null, errorMessage }))
  } }));
  await page.goto("/dashboard/ai-usage");
  await expect(page.getByRole("region", { name: "Bảng dữ liệu" })).toContainText("recent-run-0");
  await expect(page.getByRole("region", { name: "Bảng dữ liệu" })).toContainText("Dịch vụ AI đã hết thời gian chờ");
  await expect(page.locator("body")).not.toContainText("sk-secret-historical");
});

test("ERR023 submission details retain IDs and uncertainty without inviting resend", async ({ page }) => {
  await setup(page);
  await page.route("**/submissions/send", route => route.fulfill({ json: {
    id: "job-uncertain-23", projectId, status: "Failed", total: 3, successCount: 1, failedCount: 2, createdAt: stamp,
    logs: [
      { id: "attempt-success", responseId: "response-success", status: "Success", errorMessage: "", submittedAt: stamp },
      { id: "attempt-uncertain", responseId: "response-uncertain", status: "Failed", errorMessage: "Kết quả gửi chưa xác định. Không tự động gửi lại; hãy kiểm tra kết quả trên Google Forms.", submittedAt: stamp },
      { id: "attempt-legacy", responseId: "response-legacy", status: "Failed", errorMessage: "sk-secret-legacy" + "raw".repeat(300), submittedAt: stamp }
    ]
  } }));
  await page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận gửi 1 lượt", exact: true }).click();
  await page.getByRole("button", { name: /Chi tiết các lượt gửi/ }).click();
  for (const id of ["job-uncertain-23", "attempt-success", "response-success", "attempt-uncertain", "response-uncertain", "attempt-legacy", "response-legacy"]) await expect(page.getByText(id, { exact: false })).toBeVisible();
  await expect(page.getByText(/Kết quả gửi chưa xác định/).first()).toBeVisible();
  await expect(page.getByText(/Không tự động gửi lại/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Thực hiện lại", exact: true })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("sk-secret-legacy");
});

test("ERR023 ordinary and missing historical causes keep IDs and safe mixed counts without inventing uncertainty", async ({ page }) => {
  await setup(page);
  const logs = [
    { id: "ordinary-success", responseId: "ordinary-preview-0", status: "Success", errorMessage: "" },
    { id: "ordinary-http", responseId: "ordinary-preview-1", status: "Failed", errorMessage: "Google Form returned HTTP 403." },
    { id: "ordinary-missing", responseId: "ordinary-preview-2", status: "Failed", errorMessage: null },
    { id: "ordinary-unknown", responseId: "ordinary-preview-3", status: "Failed", errorMessage: "sk-private-marker <html>" + "sensitive@example.invalid".repeat(100) }
  ];
  await page.route("**/responses/generate", route => route.fulfill({ json: { items: logs.map(log => preview(log.responseId)), requestedCount: 4, generatedCount: 4, creditsUsed: 4, missingCredits: 0, balanceAfter: 16 } }));
  await page.route("**/submissions/send", route => route.fulfill({ json: { id: "job-ordinary-23", projectId, status: "Failed", total: 4, successCount: 1, failedCount: 3, createdAt: stamp, logs: logs.map(log => ({ ...log, submittedAt: stamp })) } }));
  await page.locator('input[type="number"]').fill("4");
  await page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xác nhận gửi 4 lượt", exact: true }).click();
  const results = page.locator("#workflow-step-5");
  await expect(results).toContainText("Mã lượt gửi: job-ordinary-23");
  await expect(results).toContainText("Tổng: 4");
  await expect(results).toContainText("Thành công: 1");
  await expect(results).toContainText("Thất bại: 3");
  await results.getByRole("button", { name: /Chi tiết các lượt gửi/ }).click();
  const entries = results.locator("li");
  await expect(entries).toHaveCount(4);
  for (const log of logs) {
    const entry = entries.filter({ hasText: `Mã lần gửi: ${log.id}` });
    await expect(entry).toContainText(`Mã bản xem trước: ${log.responseId}`);
    if (log.id === "ordinary-http") await expect(entry).toContainText("Google Forms trả về lỗi 403");
    if (log.id === "ordinary-missing" || log.id === "ordinary-unknown") await expect(entry).toContainText("Không xác định được nguyên nhân lỗi từ nhật ký này");
  }
  await expect(results).not.toContainText("Kết quả gửi chưa xác định");
  await expect(page.locator("body")).not.toContainText("sk-private-marker");
  await expect(page.locator("body")).not.toContainText("sensitive@example.invalid");
  await expect(results.getByRole("button", { name: "Thực hiện lại", exact: true })).toBeVisible();
});

for (const type of ["Date", "Time"]) {
  test(`ERR024 ${type} clear/retype both endpoints blocks invalid POST and sends displayed state`, async ({ page }) => {
    const calls = await setup(page, [{ ...question, questionType: type, options: [] }]);
    await page.getByRole("button", { name: "Chế độ trả lời", exact: true }).click();
    await page.getByRole("option", { name: type === "Date" ? "Khoảng ngày tuần tự" : "Khoảng giờ tuần tự", exact: true }).click();
    const from = page.getByLabel(type === "Date" ? "Từ ngày" : "Từ giờ", { exact: true });
    const to = page.getByLabel(type === "Date" ? "Đến ngày" : "Đến giờ", { exact: true });
    const create = page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true });
    await from.fill("");
    await expect(from).toHaveValue("");
    await expect(create).toBeDisabled();
    await from.fill(type === "Date" ? "2026-10-01" : "09:00");
    await to.fill("");
    await expect(to).toHaveValue("");
    await expect(create).toBeDisabled();
    await to.fill(type === "Date" ? "2026-09-01" : "08:00");
    await expect(create).toBeDisabled();
    expect(calls.filter(c => c.path.endsWith("/answer-rules"))).toHaveLength(0);
    await to.fill(type === "Date" ? "2026-10-31" : "12:00");
    await expect(create).toBeEnabled();
    await create.click();
    const rule = calls.find(c => c.path.endsWith("/answer-rules"))!.json as { configJson: string };
    expect(JSON.parse(rule.configJson)).toEqual(type === "Date" ? { fromDate: "2026-10-01", toDate: "2026-10-31" } : { fromTime: "09:00", toTime: "12:00", stepMinutes: 60 });
  });
}

test("ERR024 time step follows existing integer 5–120 bounds and mode defaults match payload", async ({ page }) => {
  const calls = await setup(page, [{ ...question, questionType: "Time", options: [] }]);
  await page.getByRole("button", { name: "Chế độ trả lời", exact: true }).click();
  await page.getByRole("option", { name: "Khoảng giờ tuần tự", exact: true }).click();
  const step = page.getByLabel("Bước phút", { exact: true });
  const create = page.getByRole("button", { name: "Lưu và tạo bản xem trước", exact: true });
  for (const value of ["", "4", "121", "5.5"]) {
    await step.fill(value);
    await expect(create).toBeDisabled();
    await expect(page.getByRole("alert").filter({ hasText: "Bước thời gian" })).toBeVisible();
  }
  for (const value of ["5", "120"]) {
    await step.fill(value);
    await expect(create).toBeEnabled();
  }
  await page.getByRole("button", { name: "Chế độ trả lời", exact: true }).click();
  await page.getByRole("option", { name: "Dòng mẫu", exact: true }).click();
  await page.getByRole("button", { name: "Chế độ trả lời", exact: true }).click();
  await page.getByRole("option", { name: "Khoảng giờ tuần tự", exact: true }).click();
  await expect(step).toHaveValue("60");
  await expect(page.getByLabel("Từ giờ", { exact: true })).toHaveValue("09:00");
  await expect(page.getByLabel("Đến giờ", { exact: true })).toHaveValue("17:00");
  await create.click();
  const rule = calls.find(call => call.path.endsWith("/answer-rules"))!.json as { configJson: string };
  expect(JSON.parse(rule.configJson)).toEqual({ fromTime: "09:00", toTime: "17:00", stepMinutes: 60 });
});
