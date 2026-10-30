import { test, expect, type Page } from "@playwright/test";
const FORM = "11111111-1111-1111-1111-111111111111";
const A = "44444444-4444-4444-4444-444444444444";
const B = "44444444-4444-4444-4444-555555555555";
const list = (items: unknown[] = []) => ({ items, page: 1, pageSize: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 });
const model = (id: string, name: string) => ({ id, formId: FORM, name, description: null, status: "Draft", formTitle: "Khảo sát thử", variableCount: 1, hasGeneratedForm: false, createdAt: "2026-10-30T00:00:00Z", updatedAt: "2026-10-30T00:00:00Z" });
const variable = (modelId: string, code: string) => ({ id: `variable-${code}`, modelId, name: `Biến ${code}`, code, variableType: "Independent", scaleType: "Likert", scalePoint: 5, minValue: null, maxValue: null, sortOrder: 1, createdAt: "2026-10-30T00:00:00Z", updatedAt: "2026-10-30T00:00:00Z" });
async function session(page: Page) {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "synthetic-nckh-error", email: "nckh-errors@example.invalid", fullName: "NCKH error fixture", role: "User", accessToken: "synthetic.nckh.fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshToken: "synthetic-refresh", refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  await page.route("**/api/**", route => { throw new Error(`Unmocked API request ${route.request().method()} ${new URL(route.request().url()).pathname}`); });
}
async function workspace(page: Page, options: { datasetFails?: () => boolean; variablesFail?: () => boolean; waitA?: Promise<void> } = {}) {
  await page.route("**/api/v1/nckh/**", async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") throw new Error(`Unexpected mutation ${pathname}`);
    if (pathname === `/api/v1/nckh/forms/${FORM}`) return route.fulfill({ json: { id: FORM, googleFormId: "synthetic-google-form", title: "Khảo sát thử", questions: [] } });
    if (pathname === "/api/v1/nckh/models") return route.fulfill({ json: list([model(A, "Mô hình A"), model(B, "Mô hình B")]) });
    const selected = pathname.includes(`/${A}/`) ? A : B;
    if (selected === A && options.waitA) await options.waitA;
    const slice = pathname.split("/").at(-1);
    if ((slice === "dataset" && options.datasetFails?.()) || (slice === "variables" && options.variablesFail?.())) return route.fulfill({ status: 503, json: { title: "Unavailable", detail: "synthetic secret marker must never render" } });
    if (slice === "variables") return route.fulfill({ json: list([variable(selected, selected === A ? "AAA" : "BBB")]) });
    return route.fulfill({ json: slice === "dataset" ? { ...list(), columns: [], hasStaleData: false } : list() });
  });
}
test.beforeEach(async ({ page }) => session(page));
test('ERR021 initial list failure stays unknown until read-only retry confirms empty', async ({ page }) => {
  let fail = true; let writes = 0;
  await page.route("**/api/v1/nckh/forms?**", route => {
    if (route.request().method() !== "GET") writes++;
    return route.fulfill(fail ? { status: 503, json: { title: "Unavailable" } } : { json: list() });
  });
  await page.goto('/dashboard/nckh');
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByText('Chưa có form nào', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nhập form', exact: true })).toHaveCount(0);
  fail = false; await page.getByRole('button', { name: 'Thử lại', exact: true }).first().click();
  await expect(page.getByText('Chưa có form nào', { exact: true })).toBeVisible();
  expect(writes).toBe(0);
});
test('ERR017 current partial failure disables mutation and export until GET retry recovers', async ({ page }) => {
  let fail = true;
  await workspace(page, { datasetFails: () => fail, variablesFail: () => fail });
  await page.goto(`/dashboard/nckh/forms/${FORM}`);
  await page.getByRole('button', { name: 'Dữ liệu', exact: true }).click();
  await expect(page.getByText('Chưa có bộ dữ liệu', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Chuẩn hóa bộ dữ liệu', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Xuất dữ liệu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bộ dữ liệu CSV' })).toBeDisabled();
  fail = false; await page.getByRole('button', { name: 'Thử tải lại dữ liệu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bộ dữ liệu CSV' })).toBeEnabled();
  await page.getByRole('button', { name: 'Dữ liệu', exact: true }).click();
  await expect(page.getByText('Chưa có bộ dữ liệu', { exact: true })).toBeVisible();
});
test('ERR017 selection B displays B while A finishes later', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await workspace(page, { waitA: gate });
  await page.goto(`/dashboard/nckh/forms/${FORM}`);
  await page.getByRole('button', { name: 'Mô hình B', exact: true }).click();
  await page.getByRole('button', { name: 'Sơ đồ quan hệ', exact: true }).click();
  await expect(page.getByText('BBB', { exact: true }).first()).toBeVisible();
  const responseA = page.waitForResponse(response => response.url().includes(`/${A}/dataset?`));
  release(); await responseA;
  await page.getByRole('button', { name: 'Dữ liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Sơ đồ quan hệ', exact: true }).click();
  await expect(page.getByText('BBB', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('AAA', { exact: true })).toHaveCount(0);
});
test('ERR021 confirmed import followed by list failure hides stale rows and retry only reads', async ({ page }) => {
  let fail = false; let imports = 0;
  await page.route('**/api/v1/nckh/forms?**', route => route.fulfill(fail ? { status: 503, json: { title: 'Unavailable' } } : { json: list([{ id: FORM, googleFormId: 'fixture-only', title: 'Danh sách trước đó', status: 'Draft', questionCount: 0, importedAt: '2026-10-30T00:00:00Z', formUrl: 'https://docs.google.com/forms/d/fixture-only/edit' }]) }));
  await page.route('**/api/v1/nckh/forms/import', route => {
    imports++; fail = true;
    return route.fulfill({ json: { id: FORM, googleFormId: 'fixture-only', title: 'Biểu mẫu vừa nhập', status: 'Draft', questionCount: 0, importedAt: '2026-10-30T00:00:00Z', formUrl: 'https://docs.google.com/forms/d/fixture-only/edit' } });
  });
  await page.goto('/dashboard/nckh');
  await expect(page.getByRole('button', { name: 'Danh sách trước đó', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Link Google Form khảo sát' }).fill('https://docs.google.com/forms/d/fixture-only/edit');
  await page.getByRole('button', { name: 'Nhập form', exact: true }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Danh sách trước đó', exact: true })).toHaveCount(0);
  await expect(page.getByText('Chưa có form nào', { exact: true })).toHaveCount(0);
  fail = false; await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Danh sách trước đó', exact: true })).toBeVisible();
  expect(imports).toBe(1);
});
