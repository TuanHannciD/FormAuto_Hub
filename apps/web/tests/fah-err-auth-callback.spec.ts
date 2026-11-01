import { expect, test } from "@playwright/test";

for (const scenario of [
  { status: 409, expected: "Vui lòng đăng nhập bằng mật khẩu trước, sau đó liên kết Google trong hồ sơ bảo mật." },
  { status: 401, expected: "Email Google chưa được xác minh hoặc mã đăng nhập không hợp lệ." },
  { status: 503, expected: "Không thể hoàn tất đăng nhập bằng Google. Vui lòng thử lại." }
]) {
  test(`id_token callback caller handles Google HTTP ${scenario.status} safely`, async ({ page }) => {
    const pageErrors: string[] = [], leakedLogs: string[] = [], badChunks: string[] = [];
    let posts = 0;
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => { if (message.text().includes("private-callback-marker")) leakedLogs.push(message.text()); });
    page.on("response", response => { if (response.url().includes("/_next/static/") && response.status() >= 400) badChunks.push(response.url()); });
    await page.route("**/api/auth/google", async route => {
      posts++;
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({ idToken: "synthetic-id-token" });
      await route.fulfill({ status: scenario.status, json: { detail: "private-callback-marker password 409 401" } });
    });
    await page.goto("/auth/callback?id_token=synthetic-id-token");
    await expect(page.getByRole("region", { name: "Đăng nhập tài khoản", exact: true }).getByRole("alert")).toHaveText(scenario.expected);
    await expect(page.getByRole("link", { name: "Quay lại đăng nhập", exact: true })).toHaveAttribute("href", "/login");
    await expect(page.locator("body")).not.toContainText("private-callback-marker");
    expect(posts).toBeGreaterThan(0);
    expect(await page.evaluate(() => localStorage.getItem("formauto.auth.session"))).toBeNull();
    expect(pageErrors).toEqual([]);
    expect(leakedLogs).toEqual([]);
    expect(badChunks).toEqual([]);
  });
}
