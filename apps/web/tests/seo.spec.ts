import { expect, test } from "@playwright/test";

const origin = process.env.SEO_EXPECTED_ORIGIN ?? "https://formautohub.servertun.pp.ua";
const publicPaths = [
  "/", "/google-forms/sample-data", "/google-forms/student-report",
  "/google-forms/survey-demo", "/google-forms/sheets-report", "/anti-abuse"
];
const privatePaths = [
  "/login", "/register", "/auth/callback", "/payment/payos/return", "/payment/payos/cancel",
  "/dashboard", "/dashboard/forms", "/dashboard/nckh", "/dashboard/nckh/forms/seo-smoke",
  "/dashboard/nckh/callback", "/admin", "/admin/manual-credits"
];

for (const path of publicPaths) {
  test(`public SEO and hydration: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    const failedChunks: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.url().includes("/_next/static/") && response.status() >= 400) {
        failedChunks.push(`${response.status()} ${response.url()}`);
      }
    });
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"] ?? "").not.toContain("noindex");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    // URL parsing normalizes the homepage's trailing slash.
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).href).toBe(new URL(path, origin).href);
    const entities = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.flatMap((script) => {
        const data = JSON.parse(script.textContent ?? "null");
        return Array.isArray(data) ? data : data["@graph"] ?? [data];
      })
    );
    const app = entities.find((entity) => entity["@type"] === "SoftwareApplication");
    const website = entities.find((entity) => entity["@type"] === "WebSite");
    expect(app).toMatchObject({ name: "FormAuto Hub", "@id": `${origin}/#application` });
    expect(app.offers).toBeUndefined();
    expect(website).toMatchObject({ name: "FormAuto Hub", "@id": `${origin}/#website` });
    if (path !== "/") {
      const webPage = entities.find((entity) => entity["@type"] === "WebPage");
      expect(webPage.isPartOf).toEqual({ "@id": website["@id"] });
      expect(webPage.mentions).toEqual({ "@id": app["@id"] });
      // Wait for the actual client-side observer to reveal the hero.
      await expect.poll(() => page.locator("h1").evaluate((element) => {
        let opacity = 1;
        for (let node: Element | null = element; node; node = node.parentElement) {
          opacity *= Number(getComputedStyle(node).opacity);
        }
        return opacity;
      })).toBe(1);
    }
    expect(errors).toEqual([]);
    expect(failedChunks).toEqual([]);
  });

  test(`public content readable without JavaScript: ${path}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(new URL(path, test.info().project.use.baseURL).href);
    const hidden = await page.locator("h1, main p, main h2, main h3").evaluateAll((elements) =>
      elements.filter((element) => {
        for (let node: Element | null = element; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (Number(style.opacity) === 0 || style.visibility === "hidden" || style.display === "none") return true;
        }
        return false;
      }).map((element) => element.textContent)
    );
    expect(hidden).toEqual([]);
    await context.close();
  });
}

for (const path of privatePaths) {
  test(`utility/private initial HTML is noindex: ${path}`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<meta name="robots" content="noindex, follow"\s*\/?\s*>/);
    expect(html).not.toContain('<meta name="robots" content="index, follow"');
  });
}

test("discovery files share only approved public URLs", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls.sort()).toEqual(publicPaths.map((path) => origin + path).sort());
  expect(xml).not.toContain("<lastmod>");
  const llms = await request.get("/llms.txt");
  expect(llms.status()).toBe(200);
  expect(llms.headers()["content-type"]).toContain("text/plain");
  const text = await llms.text();
  const listed = text.split("## Important pages")[1].split("## Recommended")[0]
    .split("\n").filter((line) => line.startsWith("- ")).map((line) => line.slice(2));
  expect(listed.sort()).toEqual(urls);
  expect(text).toContain("- Fake survey manipulation");
  expect(text).toContain("- Mass submission to third-party forms without permission");
});

test("robots retains search/training separation and missing URL returns 404", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const text = await robots.text();
  expect(text).toContain(`Sitemap: ${origin}/sitemap.xml`);
  const groups = text.split(/\n\s*\n/);
  expect(groups.find((group) => group.includes("User-Agent: OAI-SearchBot"))).toContain("Allow: /");
  expect(groups.find((group) => group.includes("User-Agent: GPTBot"))).toContain("Disallow: /");
  expect((await request.get("/seo-smoke-page-does-not-exist")).status()).toBe(404);
});
