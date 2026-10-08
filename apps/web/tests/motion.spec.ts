import { test, expect } from "@playwright/test";

// Run against the isolated server with motion-fixture.tsx installed as
// /motion-test. The fixture is deliberately absent from the production app.
test("height interpolates across unequal panels and observes later content growth", async ({ page }) => {
  await page.goto("/motion-test");
  await expect(page.locator("[data-motion-ready]")).toHaveAttribute("data-motion-ready", "true");
  const region = page.getByTestId("motion-container").locator(":scope > div");
  await expect.poll(() => region.evaluate(element => element.getBoundingClientRect().height)).toBe(80);
  const samples = await page.evaluate(async () => {
    (Array.from(document.querySelectorAll("button")).find(element => element.textContent === "Panel 2")!).click();
    const region = document.querySelector('[data-testid="motion-container"] > div')!;
    const samples: number[] = [];
    for (let frame = 0; frame < 26; frame++) {
      await new Promise(requestAnimationFrame);
      samples.push(region.getBoundingClientRect().height);
    }
    return samples;
  });
  expect(samples.some(height => height > 85 && height < 255), `Height samples: ${samples.join(", ")}`).toBe(true);
  for (let index = 1; index < samples.length; index++) expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1] - 1);
  await expect.poll(() => region.evaluate(element => element.getBoundingClientRect().height)).toBe(260);
  await page.getByRole("button", { name: "Grow content", exact: true }).click();
  await expect.poll(() => region.evaluate(element => element.getBoundingClientRect().height)).toBe(320);
});

test("interrupted transitions keep only the latest panel interactive", async ({ page }) => {
  await page.goto("/motion-test");
  await expect(page.locator("[data-motion-ready]")).toHaveAttribute("data-motion-ready", "true");
  await page.evaluate(async () => {
    for (const name of ["Panel 2", "Panel 3", "Panel 1", "Panel 3"]) {
      Array.from(document.querySelectorAll("button")).find(element => element.textContent === name)!.click();
      await new Promise(requestAnimationFrame);
    }
  });
  await expect(page.getByRole("button", { name: "Action 3", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Action 1", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Action 2", exact: true })).toHaveCount(0);
  await expect.poll(() => page.locator("[data-transition-outgoing]").count()).toBe(0);
  const region = page.getByTestId("motion-container").locator(":scope > div");
  await expect.poll(() => region.evaluate(element => element.getBoundingClientRect().height)).toBe(160);
});

test("reduced-motion switches without running size or content animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motion-test");
  await expect(page.locator("[data-motion-ready]")).toHaveAttribute("data-motion-ready", "true");
  await page.getByRole("button", { name: "Panel 2", exact: true }).click();
  await expect(page.getByRole("button", { name: "Action 2", exact: true })).toBeVisible();
  expect(await page.getByTestId("motion-container").evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  await expect(page.locator("[data-transition-outgoing]")).toHaveCount(0);
});

test("size-first hides the incoming panel until both grow and shrink have finished", async ({ page }) => {
  await page.goto("/motion-test");
  await expect(page.locator("[data-motion-ready]")).toHaveAttribute("data-motion-ready", "true");
  for (const panel of ["Panel 2", "Panel 1"]) {
    const samples = await page.evaluate(async name => {
      Array.from(document.querySelectorAll("button")).find(button => button.textContent === name)!.click();
      const samples = [];
      for (let frame = 0; frame < 32; frame++) {
        await new Promise(requestAnimationFrame);
        const region = document.querySelector("[data-transition-phase]")!;
        const current = region.querySelector<HTMLElement>("[data-transition-current]")!;
        samples.push({ phase: region.getAttribute("data-transition-phase"), height: document.querySelector("[data-animated-size]")!.getBoundingClientRect().height,
          hidden: getComputedStyle(current).visibility === "hidden", inert: current.inert });
      }
      return samples;
    }, panel);
    const resizing = samples.filter(sample => sample.phase === "resize");
    const changed = samples.filter(sample => sample.phase === "stable");
    expect(resizing.length).toBeGreaterThan(1);
    expect(resizing.every(sample => sample.hidden && sample.inert)).toBe(true);
    expect(changed.length).toBeGreaterThan(1);
    expect(changed.every(sample => !sample.hidden && !sample.inert)).toBe(true);
    const target = panel === "Panel 2" ? 260 : 80;
    expect(changed.every(sample => Math.abs(sample.height - target) < 1)).toBe(true);
  }
});
