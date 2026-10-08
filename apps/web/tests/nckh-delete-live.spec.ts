import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { AuthTokenResponse } from "@/lib/api";

const statePath = process.env.FORMAUTO_NCKH_DELETE_SMOKE_STATE;
test.skip(!statePath, "Requires disposable SQL/API NCKH delete fixture.");

test("real SQL/API: confirm and delete populated model; preserve unrelated model and imported form", async ({ browser }) => {
  const state = JSON.parse(readFileSync(statePath!, "utf8")) as {
    database: string; userSession: AuthTokenResponse; modelId: string; formId: string;
  };
  expect(state.database).toMatch(/^FormAutoHub_NckhDeleteSmoke_[a-f0-9]{32}$/);
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
  await context.route("https://localhost:7039/api/**", async route => {
    const response = await route.fetch({ url: route.request().url().replace(":7039/", ":7040/") });
    await route.fulfill({ response });
  });
  const page = await context.newPage();
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(session => localStorage.setItem("formauto.auth.session", JSON.stringify(session)), state.userSession);
  await page.goto(`http://localhost:3021/dashboard/nckh/forms/${state.formId}`);
  await page.getByRole("button", { name: "Xóa mô hình Mô hình kiểm thử xóa", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Xóa mô hình nghiên cứu" });
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  for (const [label, count] of [["Biến nghiên cứu", "2"], ["Ánh xạ câu hỏi", "1"], ["Quan hệ", "1"], ["Vị trí canvas", "2"], ["Câu trả lời khảo sát", "1"], ["Bản ghi chuẩn hóa", "1"]]) {
    await expect(dialog.getByText(label, { exact: true }).locator("..")).toContainText(count);
  }
  await page.screenshot({ path: `${process.env.TEMP}/formauto-delete-model-live-desktop.png` });
  const remove = dialog.getByRole("button", { name: "Xóa vĩnh viễn", exact: true }); await expect(remove).toBeDisabled();
  await dialog.getByLabel("Nhập đúng tên mô hình để xác nhận").fill("Mô hình kiểm thử xóa");
  const deleted = page.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/nckh/models/${state.modelId}` && r.request().method() === "DELETE");
  await remove.click(); expect((await deleted).status()).toBe(204); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Protected model", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xóa mô hình Protected model", exact: true })).toBeEnabled();
  const headers = { Authorization: `Bearer ${state.userSession.accessToken}` };
  expect((await context.request.get(`https://localhost:7040/api/v1/nckh/models/${state.modelId}`, { headers })).status()).toBe(404);
  expect((await context.request.get(`https://localhost:7040/api/v1/nckh/forms/${state.formId}`, { headers })).status()).toBe(200);
  expect(errors).toEqual([]); await context.close();
});
