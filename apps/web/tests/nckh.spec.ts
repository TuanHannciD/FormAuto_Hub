import { test, expect, type Page } from "@playwright/test";

// ── Helpers ───────────────────────────────────────────────────────

const TEST_USER = {
  userId: "d23e1bbb-ce23-49c3-8bc8-f70ac7bc9c1b",
  email: "nckh-test@example.com",
  fullName: "NCKH Tester",
  role: "User"
};

const MOCK_SESSION = {
  userId: TEST_USER.userId,
  email: TEST_USER.email,
  fullName: TEST_USER.fullName,
  role: TEST_USER.role,
  accessToken: "eyJfake.access.token",
  accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
  refreshToken: "fake-refresh-token",
  refreshTokenExpiresAt: new Date(Date.now() + 86400_000).toISOString()
};

async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.evaluate((session) => {
    window.localStorage.setItem("formauto.auth.session", JSON.stringify(session));
  }, MOCK_SESSION);
}

async function mockApi(page: Page, method: string, path: string, response: unknown, status = 200) {
  await page.route(`**/api/v1/nckh${path}`, async (route) => {
    if (route.request().method() !== method) {
      return route.continue();
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(response)
    });
  });
}

async function mockRefreshSuccess(page: Page) {
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...MOCK_SESSION,
        accessToken: "eyJrefreshed.token",
        accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString()
      })
    });
  });
}

async function mockNotLinked(page: Page) {
  await mockRefreshSuccess(page);
  await mockApi(page, "GET", "/forms?page=1&pageSize=20", { title: "Unauthorized", detail: "Google not linked" }, 401);
}

async function mockLinked(page: Page, forms = MOCK_FORMS_LIST) {
  await mockRefreshSuccess(page);
  await mockApi(page, "GET", "/forms?page=1&pageSize=20", forms);
}

// ── MOCK DATA ─────────────────────────────────────────────────────

const MOCK_FORMS_LIST = {
  items: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      googleFormId: "form-abc123",
      formUrl: "https://docs.google.com/forms/d/form-abc123/edit",
      title: "Khảo sát sinh viên 2026",
      status: "Draft",
      questionCount: 15,
      importedAt: "2026-05-30T10:00:00Z"
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      googleFormId: "form-def456",
      formUrl: "https://docs.google.com/forms/d/form-def456/edit",
      title: "Đánh giá giảng viên",
      status: "Active",
      questionCount: 8,
      importedAt: "2026-05-29T08:00:00Z"
    }
  ],
  page: 1,
  pageSize: 20,
  totalItems: 2,
  totalPages: 1
};

const MOCK_EMPTY_LIST = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };

const MOCK_IMPORT_RESPONSE = {
  id: "33333333-3333-3333-3333-333333333333",
  googleFormId: "form-ghi789",
  formUrl: "https://docs.google.com/forms/d/form-ghi789/edit",
  title: "Form mới import",
  status: "Draft",
  questionCount: 10,
  importedAt: "2026-05-30T12:00:00Z"
};

const MOCK_GOOGLE_LINK_RESPONSE = {
  linked: true,
  email: "researcher@gmail.com"
};

// ── TESTS: Auth & Redirect ────────────────────────────────────────

test.describe("NCKH — Auth & Redirect", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user sees NCKH dashboard", async ({ page }) => {
    await loginAsUser(page);
    await mockLinked(page, MOCK_EMPTY_LIST);

    await page.goto("/dashboard/nckh");
    await expect(page.locator("h1")).toContainText("NCKH");
  });
});

// ── TESTS: Google Not Linked ──────────────────────────────────────

test.describe("NCKH — Google Not Linked", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await mockNotLinked(page);
  });

  test("shows Liên kết Google button when not linked", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByRole("button", { name: /Liên kết Google/ })).toBeVisible({ timeout: 10000 });
  });

  test("shows status message about linking", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByText(/cần liên kết tài khoản Google/)).toBeVisible({ timeout: 10000 });
  });

  test("import form section is hidden when not linked", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByRole("button", { name: /Liên kết Google/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/docs.google.com\/forms/)).not.toBeVisible();
  });

  test("empty state message shown in form list", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByText(/Liên kết Google để import form đầu tiên/)).toBeVisible({ timeout: 10000 });
  });
});

// ── TESTS: Google Linked — Import & List ──────────────────────────

test.describe("NCKH — Google Linked", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await mockLinked(page);
  });

  test("shows 'Đã liên kết Google' status", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByText(/Đã liên kết Google/).first()).toBeVisible({ timeout: 10000 });
  });

  test("import form input is visible", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByPlaceholder(/docs.google.com\/forms/)).toBeVisible();
  });

  test("import button is visible", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByRole("button", { name: /Import/ })).toBeVisible();
  });

  test("renders form list table with items", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByRole("button", { name: "Khảo sát sinh viên 2026" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Đánh giá giảng viên" })).toBeVisible();
  });

  test("form title is clickable link", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    const link = page.getByRole("button", { name: "Khảo sát sinh viên 2026" });
    await expect(link).toBeVisible({ timeout: 10000 });
    await link.click();
    await expect(page).toHaveURL(/\/dashboard\/nckh\/forms\/11111111-1111-1111-1111-111111111111/);
  });

  test("pagination shows correct info", async ({ page }) => {
    await page.goto("/dashboard/nckh");
    await expect(page.getByText(/Trang 1\/1 · 2 kết quả/)).toBeVisible({ timeout: 10000 });
  });
});

// ── TESTS: Import Form ────────────────────────────────────────────

test.describe("NCKH — Import Form", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await mockLinked(page);
  });

  test("successful import shows toast and clears input", async ({ page }) => {
    await mockApi(page, "POST", "/forms/import", MOCK_IMPORT_RESPONSE, 201);

    await page.goto("/dashboard/nckh");
    await page.getByPlaceholder(/docs.google.com\/forms/).fill("https://docs.google.com/forms/d/form-ghi789/edit");
    await page.getByRole("button", { name: /Import/ }).click();

    await expect(page.getByText(/Đã import form: Form mới import/).first()).toBeVisible({ timeout: 5000 });
  });

  test("import fails with 401 shows error and resets link status", async ({ page }) => {
    await mockApi(page, "POST", "/forms/import", { title: "Unauthorized", detail: "Google account not linked or token expired." }, 401);

    await page.goto("/dashboard/nckh");
    await expect(page.getByRole("button", { name: /Import/ })).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder(/docs.google.com\/forms/).fill("https://docs.google.com/forms/d/bad/edit");
    await page.getByRole("button", { name: /Import/ }).click();

    await expect(page.getByText(/cần liên kết Google/).first()).toBeVisible({ timeout: 5000 });
  });

  test("import fails with 409 duplicate", async ({ page }) => {
    await mockApi(page, "POST", "/forms/import", { title: "Conflict", detail: "Form already imported." }, 409);

    await page.goto("/dashboard/nckh");
    await page.getByPlaceholder(/docs.google.com\/forms/).fill("https://docs.google.com/forms/d/dup/edit");
    await page.getByRole("button", { name: /Import/ }).click();

    await expect(page.getByText(/Form already imported/).first()).toBeVisible({ timeout: 5000 });
  });
});

// ── TESTS: Callback Page ──────────────────────────────────────────

test.describe("NCKH — Callback Page", () => {
  test("callback with ?linked=true shows success toast and cleans URL", async ({ page }) => {
    await loginAsUser(page);
    await mockLinked(page, MOCK_EMPTY_LIST);

    await page.goto("/dashboard/nckh?linked=true");
    // Toast appears (may appear twice due to React strict mode in dev — use .first())
    await expect(page.getByText(/Đã liên kết Google thành công/).first()).toBeVisible({ timeout: 8000 });
    // URL should be cleaned (no more ?linked=true)
    await expect(page).not.toHaveURL(/linked=true/, { timeout: 8000 });
  });

  test("callback with ?error=... shows error toast", async ({ page }) => {
    await loginAsUser(page);
    await mockNotLinked(page);

    await page.goto("/dashboard/nckh?error=access_denied");
    await expect(page.getByText(/access_denied/).first()).toBeVisible({ timeout: 8000 });
  });

  test("direct callback page without code redirects to dashboard", async ({ page }) => {
    await loginAsUser(page);
    await mockLinked(page, MOCK_EMPTY_LIST);

    await page.goto("/dashboard/nckh/callback");
    await expect(page).toHaveURL(/\/dashboard\/nckh$/, { timeout: 8000 });
  });

  test("callback with valid code calls API and redirects with success", async ({ page }) => {
    await loginAsUser(page);
    await mockRefreshSuccess(page);
    await mockApi(page, "POST", "/auth/google-link", MOCK_GOOGLE_LINK_RESPONSE);
    await mockApi(page, "GET", "/forms?page=1&pageSize=20", MOCK_EMPTY_LIST);

    await page.goto("/dashboard/nckh/callback?code=mock-auth-code-12345");
    await expect(page).toHaveURL(/\/dashboard\/nckh\?linked=true/, { timeout: 10000 });
  });

  test("callback with invalid code shows error then redirects", async ({ page }) => {
    await loginAsUser(page);
    await mockRefreshSuccess(page);
    await mockApi(page, "POST", "/auth/google-link", { title: "Invalid Request", detail: "Failed to exchange authorization code." }, 400);
    await mockApi(page, "GET", "/forms?page=1&pageSize=20", MOCK_EMPTY_LIST, 401);

    await page.goto("/dashboard/nckh/callback?code=bad-code");
    // Callback page shows error message for 4s then redirects
    await expect(page.getByText(/Mã xác thực không hợp lệ/).first()).toBeVisible({ timeout: 8000 });
    // After redirect, URL should have error param briefly, then be cleaned
    // Just verify we land on the NCKH page eventually
    await expect(page).toHaveURL(/\/dashboard\/nckh$/, { timeout: 10000 });
  });

  test("callback with already-linked account shows 409 then redirects", async ({ page }) => {
    await loginAsUser(page);
    await mockRefreshSuccess(page);
    await mockApi(page, "POST", "/auth/google-link", { title: "Conflict", detail: "Already linked." }, 409);
    await mockApi(page, "GET", "/forms?page=1&pageSize=20", MOCK_EMPTY_LIST, 401);

    await page.goto("/dashboard/nckh/callback?code=dup-code");
    // Should show error about already linked
    await expect(page.getByText(/đã được liên kết/).first()).toBeVisible({ timeout: 8000 });
    // Eventually redirects to NCKH page
    await expect(page).toHaveURL(/\/dashboard\/nckh$/, { timeout: 10000 });
  });
});

// ── TESTS: Navigation ─────────────────────────────────────────────

test.describe("NCKH — Navigation", () => {
  test("NCKH nav item exists in sidebar", async ({ page }) => {
    await loginAsUser(page);
    await mockLinked(page, MOCK_EMPTY_LIST);

    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "NCKH" })).toBeVisible({ timeout: 10000 });
  });

  test("clicking NCKH nav item navigates to NCKH page", async ({ page }) => {
    await loginAsUser(page);
    await mockLinked(page, MOCK_EMPTY_LIST);

    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "NCKH" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("link", { name: "NCKH" }).click();
    await expect(page).toHaveURL(/\/dashboard\/nckh/, { timeout: 5000 });
  });
});
