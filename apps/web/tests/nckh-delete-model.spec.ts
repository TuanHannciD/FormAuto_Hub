import { expect, test, type Page } from "@playwright/test";

const formId = "11111111-1111-1111-1111-111111111111";
const modelId = "22222222-2222-2222-2222-222222222222";
const otherId = "33333333-3333-3333-3333-333333333333";
const modelName = "Mô hình khảo sát";
const timestamp = "2026-10-08T00:00:00Z";
const model = { id: modelId, formId, name: modelName, status: "Draft", formTitle: "Survey", variableCount: 123,
  hasGeneratedForm: false, createdAt: timestamp, updatedAt: timestamp };
type Options = { generated?: boolean; generatedLater?: boolean; invalidCount?: boolean; zero?: boolean; summaryFailure?: boolean; delaySummary?: Promise<void>; delayDelete?: Promise<void>; deleteStatus?: number; rename?: boolean; selected?: boolean };

async function fixture(page: Page, options: Options = {}) {
  const state = { deletes: [] as string[], reads: 0, failed: options.summaryFailure, deleted: false };
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: "44444444-4444-4444-4444-444444444444", email: "delete-test@example.invalid", fullName: "Tester", role: "User",
    accessToken: "fixture-token", refreshToken: "fixture-refresh", accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 86400_000).toISOString()
  })));
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    let body: unknown = {};
    if (path === `/api/v1/nckh/forms/${formId}`) body = { id: formId, title: "Survey", googleFormId: "fixture", questions: [] };
    else if (path === "/api/v1/nckh/models") body = { items: [
      ...(state.deleted ? [] : [{ ...model, hasGeneratedForm: !!options.generated }]),
      ...(options.selected ? [] : [{ ...model, id: otherId, name: "Mô hình giữ lại", status: "Active" }])
    ], totalItems: options.selected ? 1 : 2, totalPages: 1, page: 1, pageSize: 100 };
    else if (path === `/api/v1/nckh/models/${modelId}`) {
      if (method === "DELETE") {
        state.deletes.push(path);
        await options.delayDelete;
        if (options.deleteStatus) { await route.fulfill({ status: options.deleteStatus, json: { title: "Conflict", detail: "Deletion rejected." } }); return; }
        state.deleted = true;
        await route.fulfill({ status: 204 }); return;
      }
      state.reads++;
      body = { ...model, name: options.rename && state.reads > 1 ? "Tên mới" : modelName, hasGeneratedForm: !!options.generated || (!!options.generatedLater && state.reads > 1) };
    } else if (path.includes("/models/")) {
      const summary = url.searchParams.get("pageSize") === "1";
      if (summary) await options.delaySummary;
      if (summary && path.endsWith("/mappings") && state.failed) {
        await route.fulfill({ status: 503, json: { detail: "Summary unavailable" } }); return;
      }
      const key = path.split("/").at(-1)!;
      const count = options.invalidCount ? -1 : options.zero ? 0 : ({ variables: 123, mappings: 456, relations: 7, responses: 234, dataset: 201 }[key] ?? 0);
      body = key === "positions" ? { items: options.zero ? [] : [{ id: "pos" }] } :
        { items: [], totalItems: summary ? count : 0, totalPages: count, page: 1, pageSize: summary ? 1 : 100, columns: [], hasStaleData: false };
    }
    await route.fulfill({ status: 200, json: body });
  });
  await page.goto(`/dashboard/nckh/forms/${formId}`);
  await page.getByRole("button", { name: `Xóa mô hình ${modelName}`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Xóa mô hình nghiên cứu" });
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  return { state, dialog, input: dialog.getByLabel("Nhập đúng tên mô hình để xác nhận"), remove: dialog.getByRole("button", { name: "Xóa vĩnh viễn", exact: true }) };
}

test("uses fresh totals, exact Vietnamese name, deletes only requested model and preserves selection", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const { state, dialog, input, remove } = await fixture(page);
  for (const [label, count] of [["Biến nghiên cứu", "123"], ["Ánh xạ câu hỏi", "456"], ["Câu trả lời khảo sát", "234"], ["Bản ghi chuẩn hóa", "201"]]) {
    await expect(dialog.getByText(label, { exact: true }).locator("..")).toContainText(count);
  }
  await expect(remove).toBeDisabled();
  for (const value of [" ", "Mô hình", modelName.toUpperCase(), "Mo hinh khao sat", `${modelName} `]) {
    await input.fill(value); await expect(remove).toBeDisabled();
  }
  await input.fill(modelName); await expect(remove).toBeEnabled(); await remove.click();
  await expect(dialog).toHaveCount(0);
  expect(state.deletes).toEqual([`/api/v1/nckh/models/${modelId}`]);
  await expect(page.getByRole("button", { name: "Mô hình giữ lại", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xóa mô hình Mô hình giữ lại", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: `Xóa mô hình ${modelName}`, exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const dismissal of ["cancel", "escape", "backdrop"] as const) test(`dismiss ${dismissal} sends no DELETE and reopening resets name`, async ({ page }) => {
  const { state, dialog, input } = await fixture(page);
  await input.fill(modelName);
  if (dismissal === "cancel") await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  if (dismissal === "escape") await page.keyboard.press("Escape");
  if (dismissal === "backdrop") await page.mouse.click(2, 2);
  await expect(dialog).toHaveCount(0); expect(state.deletes).toEqual([]);
  await page.getByRole("button", { name: `Xóa mô hình ${modelName}`, exact: true }).click();
  await expect(input).toHaveValue("");
});

test("loading and partial GET failure block deletion; reload recovers", async ({ page }) => {
  let release!: () => void;
  const delay = new Promise<void>(resolve => { release = resolve; });
  const { state, dialog, input, remove } = await fixture(page, { summaryFailure: true, delaySummary: delay });
  await expect(dialog.getByRole("status")).toBeVisible(); await expect(remove).toBeDisabled();
  release(); await expect(dialog.getByRole("alert")).toBeVisible(); await expect(remove).toBeDisabled();
  expect(state.deletes).toEqual([]);
  state.failed = false; await dialog.getByRole("button", { name: "Tải lại thông tin" }).click();
  await input.fill(modelName); await expect(remove).toBeEnabled();
});

test("renamed model at final check requires refreshed information and a new confirmation", async ({ page }) => {
  const { state, dialog, input, remove } = await fixture(page, { rename: true });
  await input.fill(modelName); await remove.click();
  await expect(dialog.getByRole("alert")).toContainText("Mô hình đã thay đổi"); expect(state.deletes).toEqual([]);
  await expect(remove).toBeDisabled(); await dialog.getByRole("button", { name: "Tải lại thông tin" }).click();
  await input.fill(modelName); await expect(remove).toBeDisabled(); await input.fill("Tên mới"); await expect(remove).toBeEnabled();
});

test("existing generated-form restriction is explained and cannot be confirmed", async ({ page }) => {
  const { state, dialog, input, remove } = await fixture(page, { generated: true });
  await expect(dialog.getByText(/Mô hình đã sinh form mới/)).toBeVisible();
  await expect(input).toHaveCount(0); await expect(remove).toBeDisabled(); expect(state.deletes).toEqual([]);
});

test("form generated in another tab before final check prevents DELETE", async ({ page }) => {
  const { state, dialog, input, remove } = await fixture(page, { generatedLater: true });
  await input.fill(modelName); await remove.click();
  await expect(dialog.getByRole("alert")).toContainText("Mô hình đã thay đổi"); expect(state.deletes).toEqual([]);
  await dialog.getByRole("button", { name: "Tải lại thông tin" }).click();
  await expect(dialog.getByText(/Mô hình đã sinh form mới/)).toBeVisible(); await expect(remove).toBeDisabled();
});

test("malformed count never permits confirmation", async ({ page }) => {
  const { state, dialog, remove } = await fixture(page, { invalidCount: true });
  await expect(dialog.getByRole("alert")).toContainText("Không xác định được đầy đủ");
  await expect(remove).toBeDisabled(); expect(state.deletes).toEqual([]);
});

test("cancel during impact loading ignores late results", async ({ page }) => {
  let release!: () => void;
  const delay = new Promise<void>(resolve => { release = resolve; });
  const { state, dialog } = await fixture(page, { delaySummary: delay });
  await dialog.getByRole("button", { name: "Hủy" }).click(); await expect(dialog).toHaveCount(0);
  release(); await page.getByRole("button", { name: `Xóa mô hình ${modelName}`, exact: true }).click();
  await expect(dialog.getByLabel("Nhập đúng tên mô hình để xác nhận")).toHaveValue(""); expect(state.deletes).toEqual([]);
});

for (const status of [404, 409, 500]) test(`DELETE ${status} keeps popup open and requires reload, without automatic replay`, async ({ page }) => {
  const { state, dialog, input, remove } = await fixture(page, { deleteStatus: status });
  await input.fill(modelName); await remove.click();
  await expect(dialog.getByRole("alert")).toBeVisible(); await expect(remove).toBeDisabled();
  expect(state.deletes).toHaveLength(1);
  await expect(dialog.getByRole("button", { name: "Tải lại thông tin" })).toBeVisible();
});

test("while DELETE is pending, repeated click, Escape, backdrop and cancel cannot interrupt it", async ({ page }) => {
  let release!: () => void;
  const delay = new Promise<void>(resolve => { release = resolve; });
  const { state, dialog, input, remove } = await fixture(page, { delayDelete: delay });
  await input.fill(modelName); await remove.dblclick();
  await expect.poll(() => state.deletes.length).toBe(1);
  await expect(dialog.getByRole("button", { name: "Đang xóa..." })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Hủy" })).toBeDisabled();
  await page.keyboard.press("Escape"); await page.mouse.click(2, 2);
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  release(); await expect(dialog).toHaveCount(0); expect(state.deletes).toHaveLength(1);
});

test("empty model on 320px viewport and reduced motion can be confirmed with accessible footer", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 }); await page.emulateMedia({ reducedMotion: "reduce" });
  const { dialog, input, remove } = await fixture(page, { zero: true, selected: true });
  await input.fill(modelName); await expect(remove).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await remove.boundingBox(); expect(box!.y + box!.height).toBeLessThanOrEqual(640);
  await page.screenshot({ path: `${process.env.TEMP}/formauto-delete-model-mobile.png` });
  await remove.click(); await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Chưa có mô hình nghiên cứu", { exact: true })).toBeVisible();
});
