import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Browser-only fixtures. Never contacts providers or a database.
const root = resolve(__dirname, "../../../artifacts/reports/ui-cleanup-2026-11-02");
const data = JSON.parse(readFileSync(resolve(root, "fixture-data.json"), "utf8"));
const routes = ["/dashboard", "/dashboard/forms", "/dashboard/top-up", "/dashboard/top-up/fixture-order", "/dashboard", "/dashboard", "/dashboard/ai-usage", "/dashboard/nckh", "/dashboard/nckh/callback", "/dashboard/nckh/forms/fixture-form", "/admin", "/admin/payments", "/admin/manual-credits", "/admin/packages", "/admin/revenue", "/admin/payos-settings", "/admin/ai-provider-settings", "/admin/ai-usage"];

test("authenticated surface geometry and forms state evidence", async ({ page }) => {
  test.setTimeout(240000);
  const phase = process.env.UI_CLEANUP_PHASE ?? "after";
  const destination = resolve(root, phase);
  mkdirSync(destination, { recursive: true });
  const manifest: unknown[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.url().includes("/_next/") && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "ui-audit-fixture", email: "audit@example.invalid", fullName: "Người dùng khảo sát UI", role: "Admin", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  let questionCount = 1;
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/forms/analyze") return route.fulfill({ json: { ...data.analysis, questions: Array.from({ length: questionCount }, (_, index) => ({ ...data.analysis.questions[index % 10], id: `q${index}`, entryId: `entry.${index}`, orderIndex: index })) } });
    if (path.endsWith("ai-prompt-profile")) return route.fulfill({ status: 404 });
    if (path.endsWith("/send-rules-direct")) return route.fulfill({ json: { id: "fixture-job", projectId: data.analysis.projectId, status: "Completed", total: 1, successCount: 1, failedCount: 0, createdAt: data.analysis.createdAt, logs: [] } });
    if (path === "/api/v1/nckh/forms/fixture-form") return route.fulfill({ json: { id: "fixture-form", googleFormId: "fixture", title: "Khảo sát minh họa", questions: [] } });
    if (route.request().method() !== "GET") throw new Error(`Unmocked mutation ${path}`);
    return route.fulfill({ json: data.fixtures[path] ?? { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
  });
  async function capture(name: string) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(destination, `${name}.png`), fullPage: true, animations: "disabled" });
    manifest.push({ name, url: page.url(), ...await page.evaluate(() => ({ width: innerWidth, height: innerHeight, pageHeight: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth, actions: Array.from(document.querySelectorAll("main button, main a")).slice(0, 12).map(el => ({ text: el.textContent, y: el.getBoundingClientRect().top + scrollY })) })) });
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.getByText("Đang kiểm tra phiên đăng nhập...", { exact: true })).toHaveCount(0);
      if (route === "/dashboard/top-up/fixture-order") {
        const dialog = page.getByRole("dialog", { name: "Chi tiết yêu cầu nạp", exact: true });
        await expect(dialog).toHaveAttribute("data-popup-phase", "open");
        await expect(dialog).toContainText("50.000");
      }
      await capture(`${route.replaceAll("/", "_")}-${width}`);
    }
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
    await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await capture(`account-profile-${width}`);
    await page.getByRole("button", { name: "Bảo mật", exact: true }).click();
    await capture(`account-security-${width}`);
    await page.getByRole("button", { name: "Đóng tài khoản", exact: true }).click();
    for (questionCount of [1, 10, 30]) {
      await page.goto("/dashboard/forms");
      await page.getByLabel("Link Google Form").fill(data.analysis.formUrl);
      await page.getByRole("button", { name: "Phân tích biểu mẫu", exact: true }).click();
      await expect(page.getByRole("button", { name: "Tạo và gửi ngay", exact: true })).toBeVisible();
      await capture(`forms-rules-${questionCount}-${width}`);
      await page.getByRole("button", { name: /AI mặc định.*x2/ }).click();
      await capture(`forms-ai-default-${questionCount}-${width}`);
      await page.getByRole("button", { name: /AI tùy chỉnh.*x3/ }).click();
      await capture(`forms-ai-custom-${questionCount}-${width}`);
    }
  }
  for (const width of [320, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard/forms");
    await capture(`forms-initial-${width}`);
  }
  writeFileSync(resolve(destination, "manifest.json"), JSON.stringify({ phase, manifest, errors }, null, 2));
  expect(errors).toEqual([]);
});
