import { test, expect, type Page } from "@playwright/test";

// === FILE MAP (nckh.spec.ts - NCKH browser smoke suite) ===
// Line    Test Region                    Purpose
// 5       Helpers and fixtures            Login/session setup, API route mocking, sample payloads
// 275     Auth and redirect tests         Verify unauthenticated redirect and dashboard access
// 292     Google not linked tests         Verify link prompt and hidden import workflow
// 322     Google linked tests             Verify linked dashboard state
// 365     Import form tests               Verify import flow states and API calls
// 429     Callback page tests             Verify OAuth callback result handling
// 510     Navigation tests                Verify dashboard route navigation
// 532     Phase 7 workspace tests         Verify workspace tabs, canvas, data, export UI flows
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
  title: "Form mới nhập",
  status: "Draft",
  questionCount: 10,
  importedAt: "2026-05-30T12:00:00Z"
};

const MOCK_GOOGLE_LINK_RESPONSE = {
  linked: true,
  email: "researcher@gmail.com"
};

const MOCK_FORM_DETAIL = {
  id: "11111111-1111-1111-1111-111111111111",
  googleFormId: "form-abc123",
  title: "Khảo sát sinh viên 2026",
  questions: [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      googleQuestionId: "q1",
      questionText: "Bạn hài lòng với khóa học không?",
      questionType: "Likert",
      isRequired: true,
      orderIndex: 1
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      googleQuestionId: "q2",
      questionText: "Góp ý thêm",
      questionType: "Paragraph",
      isRequired: false,
      orderIndex: 2
    }
  ]
};

const MOCK_MODEL = {
  id: "44444444-4444-4444-4444-444444444444",
  formId: "11111111-1111-1111-1111-111111111111",
  name: "Mô hình hài lòng sinh viên",
  description: "Mô hình nền",
  status: "Draft",
  formTitle: "Khảo sát sinh viên 2026",
  variableCount: 1,
  hasGeneratedForm: true,
  createdAt: "2026-06-05T08:00:00Z",
  updatedAt: "2026-06-05T08:30:00Z"
};

const MOCK_ACTIVE_MODEL = {
  ...MOCK_MODEL,
  status: "Active"
};

const MOCK_VARIABLE = {
  id: "55555555-5555-5555-5555-555555555555",
  modelId: MOCK_MODEL.id,
  name: "Sự hài lòng",
  code: "SAT",
  variableType: "Dependent",
  scaleType: "Likert",
  scalePoint: 5,
  minValue: null,
  maxValue: null,
  sortOrder: 1,
  createdAt: "2026-06-05T08:10:00Z",
  updatedAt: "2026-06-05T08:10:00Z"
};

const MOCK_VARIABLE_2 = {
  id: "66666666-6666-6666-6666-666666666666",
  modelId: MOCK_MODEL.id,
  name: "Chất lượng dịch vụ",
  code: "SER",
  variableType: "Independent",
  scaleType: "Likert",
  scalePoint: 5,
  minValue: null,
  maxValue: null,
  sortOrder: 2,
  createdAt: "2026-06-05T08:12:00Z",
  updatedAt: "2026-06-05T08:12:00Z"
};

const MOCK_VARIABLE_3 = {
  id: "99999999-aaaa-bbbb-cccc-999999999999",
  modelId: MOCK_MODEL.id,
  name: "Cột sống tôi",
  code: "CST",
  variableType: "Independent",
  scaleType: "Likert",
  scalePoint: 5,
  minValue: null,
  maxValue: null,
  sortOrder: 1,
  createdAt: "2026-06-05T08:14:00Z",
  updatedAt: "2026-06-05T08:14:00Z"
};

const MOCK_RELATION = {
  id: "77777777-7777-7777-7777-777777777777",
  modelId: MOCK_MODEL.id,
  fromVariableId: MOCK_VARIABLE_2.id,
  fromVariableName: MOCK_VARIABLE_2.name,
  fromVariableCode: MOCK_VARIABLE_2.code,
  toVariableId: MOCK_VARIABLE.id,
  toVariableName: MOCK_VARIABLE.name,
  toVariableCode: MOCK_VARIABLE.code,
  direction: "Positive",
  hypothesisCode: "H1",
  hypothesisText: "Chất lượng dịch vụ có tác động cùng chiều đến sự hài lòng",
  sortOrder: 1,
  createdAt: "2026-06-05T08:20:00Z",
  updatedAt: "2026-06-05T08:20:00Z"
};

async function mockWorkspace(page: Page) {
  await mockRefreshSuccess(page);
  await mockApi(page, "GET", `/forms/${MOCK_FORM_DETAIL.id}`, MOCK_FORM_DETAIL);
  await mockApi(page, "GET", "/models?page=1&pageSize=100", {
    items: [MOCK_MODEL],
    page: 1,
    pageSize: 100,
    totalItems: 1,
    totalPages: 1
  });
  await mockApi(page, "GET", `/models/${MOCK_MODEL.id}/variables?page=1&pageSize=100`, {
    items: [MOCK_VARIABLE, MOCK_VARIABLE_2],
    page: 1,
    pageSize: 100,
    totalItems: 2,
    totalPages: 1
  });
  await mockApi(page, "GET", `/models/${MOCK_MODEL.id}/mappings?page=1&pageSize=100`, {
    items: [],
    page: 1,
    pageSize: 100,
    totalItems: 0,
    totalPages: 0
  });
  await mockApi(page, "GET", `/models/${MOCK_MODEL.id}/relations?page=1&pageSize=100`, {
    items: [MOCK_RELATION],
    page: 1,
    pageSize: 100,
    totalItems: 1,
    totalPages: 0
  });
  await mockApi(page, "GET", `/models/${MOCK_MODEL.id}/positions`, {
    items: [
      { id: "88888888-8888-8888-8888-888888888888", nodeType: "Variable", variableId: MOCK_VARIABLE_2.id, relationId: null, positionX: 32, positionY: 88, updatedAt: "2026-06-05T08:21:00Z" },
      { id: "99999999-9999-9999-9999-999999999999", nodeType: "Variable", variableId: MOCK_VARIABLE.id, relationId: null, positionX: 264, positionY: 88, updatedAt: "2026-06-05T08:21:00Z" },
      { id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", nodeType: "Relation", variableId: null, relationId: MOCK_RELATION.id, positionX: 128, positionY: 188, updatedAt: "2026-06-05T08:21:00Z" }
    ]
  });
  await mockApi(page, "GET", `/models/${MOCK_MODEL.id}/responses?page=1&pageSize=20`, {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  });
  await mockApi(page, "GET", `/models/${MOCK_MODEL.id}/dataset?page=1&pageSize=20`, {
    columns: ["RespondentId", "SAT_1", "SAT_mean"],
    hasStaleData: false,
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  });
}

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
    await expect(page.getByText(/Liên kết Google để nhập form đầu tiên/)).toBeVisible({ timeout: 10000 });
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
    await expect(page.getByRole("button", { name: /Nhập form/ })).toBeVisible();
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
    await page.getByRole("button", { name: /Nhập form/ }).click();

    await expect(page.getByText(/Đã nhập form: Form mới nhập/).first()).toBeVisible({ timeout: 5000 });
  });

  test("import fails with 401 shows error and resets link status", async ({ page }) => {
    await mockApi(page, "POST", "/forms/import", { title: "Unauthorized", detail: "Google account not linked or token expired." }, 401);

    await page.goto("/dashboard/nckh");
    await expect(page.getByRole("button", { name: /Nhập form/ })).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder(/docs.google.com\/forms/).fill("https://docs.google.com/forms/d/bad/edit");
    await page.getByRole("button", { name: /Nhập form/ }).click();

    await expect(page.getByText(/cần liên kết Google/).first()).toBeVisible({ timeout: 5000 });
  });

  test("import fails with 409 duplicate", async ({ page }) => {
    await mockApi(page, "POST", "/forms/import", { title: "Conflict", detail: "Form already imported." }, 409);

    await page.goto("/dashboard/nckh");
    await page.getByPlaceholder(/docs.google.com\/forms/).fill("https://docs.google.com/forms/d/dup/edit");
    await page.getByRole("button", { name: /Nhập form/ }).click();

    await expect(page.getByText(/Không nhập được form/).first()).toBeVisible({ timeout: 5000 });
  });

  test("prevents duplicate import submit while request is pending", async ({ page }) => {
    let importRequestCount = 0;
    await page.route("**/api/v1/nckh/forms/import", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }
      importRequestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(MOCK_IMPORT_RESPONSE)
      });
    });

    await page.goto("/dashboard/nckh");
    await page.getByPlaceholder(/docs.google.com\/forms/).fill("https://docs.google.com/forms/d/form-ghi789/edit");
    const importButton = page.getByRole("button", { name: /Nhập form/ });

    await importButton.click();
    await expect(page.getByRole("button", { name: /Đang nhập/ })).toBeDisabled();
    await expect.poll(() => importRequestCount).toBe(1);
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
    await expect(page.getByText(/Không hoàn tất được liên kết Google/).first()).toBeVisible({ timeout: 8000 });
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
    let googleLinkRequestCount = 0;
    await page.route("**/api/v1/nckh/auth/google-link", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }
      googleLinkRequestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GOOGLE_LINK_RESPONSE)
      });
    });
    await mockApi(page, "GET", "/forms?page=1&pageSize=20", MOCK_EMPTY_LIST);

    await page.goto("/dashboard/nckh/callback?code=mock-auth-code-12345");
    await expect(page.getByText(/Đã liên kết Google thành công/).first()).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/nckh$/, { timeout: 10000 });
    expect(googleLinkRequestCount).toBe(1);
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

// ── TESTS: Phase 7 Workspace ─────────────────────────────────────

test.describe("NCKH — Phase 7 Workspace", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await mockWorkspace(page);
  });

  test("renders form workspace with model tabs", async ({ page }) => {
    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);

    await expect(page.getByText("Mã Google Form: form-abc123")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Tổng quan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tạo form" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dữ liệu", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xuất dữ liệu" })).toBeVisible();
    await expect(page.getByText("Mô hình hài lòng sinh viên").last()).toBeVisible();
  });

  test("opens variables and mapping popups from canvas", async ({ page }) => {
    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByText("Mã Google Form: form-abc123")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();
    await page.getByRole("button", { name: "Biến", exact: true }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Biến nghiên cứu").last()).toBeVisible();
    await expect(page.getByText("Sự hài lòng").last()).toBeVisible();
    await page.getByRole("button", { name: "Đóng" }).click();

    await page.getByRole("button", { name: "Ánh xạ", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Ánh xạ câu hỏi - biến").last()).toBeVisible();
    await expect(page.getByPlaceholder("Mã quan sát")).toBeVisible();
  });

  test("normalizes Likert variable payload from the canvas popup", async ({ page }) => {
    let createVariablePayload: { scaleType?: string; scalePoint?: number | null; minValue?: number | null; maxValue?: number | null } | null = null;
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/variables`, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      createVariablePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ...MOCK_VARIABLE_3
        })
      });
    });

    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();
    await page.getByRole("button", { name: "Biến", exact: true }).click();

    await page.getByPlaceholder("Tên biến").fill("Cột sống tôi");
    await page.getByPlaceholder("Mã biến").fill("CST");
    await page.getByPlaceholder("Điểm thang đo").fill("5");
    await expect(page.getByPlaceholder("Giá trị nhỏ nhất")).toBeDisabled();
    await expect(page.getByPlaceholder("Giá trị lớn nhất")).toBeDisabled();
    await page.getByRole("button", { name: "Thêm" }).click();

    await expect.poll(() => createVariablePayload).toMatchObject({
      scaleType: "Likert",
      scalePoint: 5,
      minValue: null,
      maxValue: null
    });
  });

  test("places unsaved new variables on a visible canvas slot", async ({ page }) => {
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/variables?page=1&pageSize=100`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [MOCK_VARIABLE_3, MOCK_VARIABLE, MOCK_VARIABLE_2],
          page: 1,
          pageSize: 100,
          totalItems: 3,
          totalPages: 1
        })
      });
    });

    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();

    const newNode = page.locator(`[data-testid="rf__node-Variable:${MOCK_VARIABLE_3.id}"]:visible`);
    const savedNode = page.locator(`[data-testid="rf__node-Variable:${MOCK_VARIABLE_2.id}"]:visible`);
    await expect(page.getByText("Cột sống tôi")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
    const newBox = await newNode.boundingBox();
    const savedBox = await savedNode.boundingBox();
    expect(newBox).not.toBeNull();
    expect(savedBox).not.toBeNull();
    expect(Math.abs(newBox!.x - savedBox!.x) > 20 || Math.abs(newBox!.y - savedBox!.y) > 20).toBe(true);
  });

  test("renders Phase 9 visual canvas using existing relation and position APIs", async ({ page }) => {
    let savePositionsPayload: unknown = null;
    let createRelationPayload: { fromVariableId?: string; toVariableId?: string; direction?: string } | null = null;
    let updateRelationPayload: { direction?: string } | null = null;
    let relationItems = [MOCK_RELATION];
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/relations**`, async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: relationItems,
            page: 1,
            pageSize: 100,
            totalItems: relationItems.length,
            totalPages: relationItems.length > 0 ? 1 : 0
          })
        });
        return;
      }
      if (method === "POST") {
        createRelationPayload = route.request().postDataJSON();
        const createdRelation = {
          ...MOCK_RELATION,
          id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          fromVariableId: createRelationPayload?.fromVariableId ?? MOCK_VARIABLE.id,
          fromVariableName: MOCK_VARIABLE.name,
          fromVariableCode: MOCK_VARIABLE.code,
          toVariableId: createRelationPayload?.toVariableId ?? MOCK_VARIABLE_2.id,
          toVariableName: MOCK_VARIABLE_2.name,
          toVariableCode: MOCK_VARIABLE_2.code,
          direction: createRelationPayload?.direction ?? "Positive",
          hypothesisCode: "H2"
        };
        relationItems = [...relationItems, createdRelation];
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(createdRelation) });
        return;
      }
      await route.continue();
    });
    await page.route(`**/api/v1/nckh/relations/${MOCK_RELATION.id}`, async (route) => {
      if (route.request().method() !== "PUT") {
        await route.continue();
        return;
      }
      updateRelationPayload = route.request().postDataJSON();
      relationItems = relationItems.map((item) => item.id === MOCK_RELATION.id ? { ...item, direction: updateRelationPayload?.direction ?? item.direction } : item);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(relationItems[0]) });
    });
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/positions`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              { id: "88888888-8888-8888-8888-888888888888", nodeType: "Variable", variableId: MOCK_VARIABLE_2.id, relationId: null, positionX: 32, positionY: 88, updatedAt: "2026-06-05T08:21:00Z" },
              { id: "99999999-9999-9999-9999-999999999999", nodeType: "Variable", variableId: MOCK_VARIABLE.id, relationId: null, positionX: 264, positionY: 88, updatedAt: "2026-06-05T08:21:00Z" }
            ]
          })
        });
        return;
      }
      if (route.request().method() !== "PUT") {
        await route.continue();
        return;
      }
      savePositionsPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] })
      });
    });

    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();

    await expect(page.getByText("Sơ đồ quan hệ mô hình")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Chất lượng dịch vụ").last()).toBeVisible();
    await expect(page.getByText("Sự hài lòng").last()).toBeVisible();
    await expect(page.locator(".react-flow__edge").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("2 vị trí đã lưu.")).toBeVisible();
    await expect(page.getByText("Trạng thái sơ đồ")).toBeVisible();

    const satNode = page.locator(`[data-testid="rf__node-Variable:${MOCK_VARIABLE.id}"]:visible`);
    await satNode.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Lưu bố cục" }).click();
    await expect.poll(() => {
      const payload = savePositionsPayload as { positions?: Array<{ nodeType: string; variableId?: string | null; relationId?: string | null; positionX?: number; positionY?: number }> } | null;
      const savedSat = payload?.positions?.find((item) => item.nodeType === "Variable" && item.variableId === MOCK_VARIABLE.id);
      return Boolean(
        savedSat
        && typeof savedSat.positionX === "number"
        && payload.positions.some((item) => item.nodeType === "Variable" && item.variableId === MOCK_VARIABLE_2.id)
        && !payload.positions.some((item) => item.nodeType === "Relation")
      );
    }).toBe(true);

    await page.getByRole("button", { name: "H1 · Cùng chiều" }).click();
    const selectedRelationPanel = page.getByTestId("selected-relation-panel");
    await expect(selectedRelationPanel).toContainText("SER -> SAT");
    await selectedRelationPanel.getByRole("button", { name: "Ngược chiều" }).click();
    await expect.poll(() => updateRelationPayload).toMatchObject({ direction: "Negative" });

    const satSourceHandle = satNode.locator(".react-flow__handle.source").first();
    const serTargetHandle = page.locator(`[data-testid="rf__node-Variable:${MOCK_VARIABLE_2.id}"]:visible .react-flow__handle.target`).first();
    const sourceBox = await satSourceHandle.boundingBox();
    const targetBox = await serTargetHandle.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect.poll(() => createRelationPayload).toMatchObject({
      fromVariableId: MOCK_VARIABLE.id,
      toVariableId: MOCK_VARIABLE_2.id,
      direction: "Positive"
    });
  });

  test("deletes a relation from the canvas action list", async ({ page }) => {
    let relationItems = [MOCK_RELATION];

    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/relations**`, async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: relationItems,
            page: 1,
            pageSize: 100,
            totalItems: relationItems.length,
            totalPages: relationItems.length > 0 ? 1 : 0
          })
        });
        return;
      }
      await route.continue();
    });

    await page.route(`**/api/v1/nckh/relations/${MOCK_RELATION.id}`, async (route) => {
      if (route.request().method() !== "DELETE") {
        await route.continue();
        return;
      }
      relationItems = [];
      await route.fulfill({ status: 204, body: "" });
    });

    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();

    await page.getByRole("button", { name: "Xóa quan hệ H1" }).first().click();
    await expect(page.getByText("Chưa có quan hệ", { exact: true }).first()).toBeVisible({ timeout: 10000 });
  });

  test("blocks duplicate canvas relation before sending API request", async ({ page }) => {
    let createRelationCalls = 0;
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/relations`, async (route) => {
      if (route.request().method() === "POST") {
        createRelationCalls += 1;
        await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ title: "Bad Request" }) });
        return;
      }
      await route.continue();
    });

    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();

    const serSourceHandle = page.locator(`[data-testid="rf__node-Variable:${MOCK_VARIABLE_2.id}"]:visible .react-flow__handle.source`).first();
    const satTargetHandle = page.locator(`[data-testid="rf__node-Variable:${MOCK_VARIABLE.id}"]:visible .react-flow__handle.target`).first();
    const sourceBox = await serSourceHandle.boundingBox();
    const targetBox = await satTargetHandle.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 12 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    expect(createRelationCalls).toBe(0);
  });

  test("keeps canvas relation and position edits read-only for active models", async ({ page }) => {
    await page.route("**/api/v1/nckh/models?page=1&pageSize=100", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [MOCK_ACTIVE_MODEL],
          page: 1,
          pageSize: 100,
          totalItems: 1,
          totalPages: 1
        })
      });
    });

    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();

    await expect(page.getByText("Chỉ có thể chỉnh sửa quan hệ và vị trí khi mô hình còn là bản nháp.")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Lưu bố cục" })).toBeDisabled();
    await page.getByRole("button", { name: "Chọn quan hệ H1" }).click();
    await expect(page.getByTestId("selected-relation-panel")).toBeVisible();
    await expect(page.getByTestId("selected-relation-panel").getByRole("button", { name: "Ngược chiều" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Xóa quan hệ H1" }).first()).toBeDisabled();
  });

  test("deletes a variable from the canvas node action button", async ({ page }) => {
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/relations?page=1&pageSize=100`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0 })
      });
    });

    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/positions`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              { id: "88888888-8888-8888-8888-888888888888", nodeType: "Variable", variableId: MOCK_VARIABLE_2.id, relationId: null, positionX: 32, positionY: 88, updatedAt: "2026-06-05T08:21:00Z" },
              { id: "99999999-9999-9999-9999-999999999999", nodeType: "Variable", variableId: MOCK_VARIABLE.id, relationId: null, positionX: 264, positionY: 88, updatedAt: "2026-06-05T08:21:00Z" }
            ]
          })
        });
        return;
      }
      await route.continue();
    });

    let deletedVariableId: string | null = null;
    await page.route(`**/api/v1/nckh/variables/${MOCK_VARIABLE.id}`, async (route) => {
      if (route.request().method() !== "DELETE") {
        await route.continue();
        return;
      }
      deletedVariableId = MOCK_VARIABLE.id;
      await route.fulfill({ status: 204, body: "" });
    });

    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await expect(page.getByRole("button", { name: "Sơ đồ quan hệ" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Sơ đồ quan hệ" }).click();

    const deleteButton = page.locator(`[data-testid="rf__node-Variable:${MOCK_VARIABLE.id}"]:visible`).getByRole("button", { name: `Xóa biến ${MOCK_VARIABLE.code}` });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();
    await expect.poll(() => deletedVariableId).toBe(MOCK_VARIABLE.id);
  });

  test("shows export actions without adding new backend contracts", async ({ page }) => {
    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await page.getByRole("button", { name: "Xuất dữ liệu" }).click();

    await expect(page.getByRole("button", { name: /Bộ dữ liệu CSV/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Codebook Excel/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cú pháp SPSS/ })).toBeVisible();
  });

  test("uses update action when selected model already has a generated form", async ({ page }) => {
    let generatePayload: unknown = null;
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/generate-form`, async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }
      generatePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          formId: MOCK_FORM_DETAIL.id,
          googleFormId: MOCK_FORM_DETAIL.googleFormId,
          formUrl: "https://docs.google.com/forms/d/form-abc123/edit",
          questionsCreated: 2,
          questionsUpdated: 0,
          questionsDeleted: 0,
          reimported: true
        })
      });
    });

    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await page.getByRole("button", { name: "Tạo form", exact: true }).click();
    await page.getByRole("button", { name: "Cập nhật form từ mô hình" }).click();

    await expect.poll(() => generatePayload).toEqual({ action: "Update" });
  });

  test("disables update action while request is submitting", async ({ page }) => {
    let generateRequestCount = 0;
    await page.route(`**/api/v1/nckh/models/${MOCK_MODEL.id}/generate-form`, async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue();
      }
      generateRequestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          formId: MOCK_FORM_DETAIL.id,
          googleFormId: MOCK_FORM_DETAIL.googleFormId,
          formUrl: "https://docs.google.com/forms/d/form-abc123/edit",
          questionsCreated: 2,
          questionsUpdated: 0,
          questionsDeleted: 0,
          reimported: true
        })
      });
    });

    await page.goto(`/dashboard/nckh/forms/${MOCK_FORM_DETAIL.id}`);
    await page.getByRole("button", { name: "Tạo form", exact: true }).click();
    const updateButton = page.getByRole("button", { name: "Cập nhật form từ mô hình" });

    await updateButton.click();
    await expect(page.getByRole("button", { name: "Đang cập nhật..." })).toBeDisabled();
    await expect.poll(() => generateRequestCount).toBe(1);
  });
});

