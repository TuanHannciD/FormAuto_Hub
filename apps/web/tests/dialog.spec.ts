import { expect, test } from "@playwright/test";

test("shared confirmation cancels safely and confirms only after closing", async ({ page }) => {
  await page.goto("/dialog-test");
  const trigger = page.getByRole("button", { name: "Request deletion" });
  const count = page.getByLabel("Confirmed deletions");
  const dialog = page.getByRole("dialog", { name: "Xác nhận xóa" });
  for (const dismissal of ["cancel", "escape", "outside"]) {
    await trigger.click();
    await expect(dialog).toHaveAttribute("data-popup-phase", "open");
    if (dismissal === "cancel") await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
    else if (dismissal === "escape") await page.keyboard.press("Escape");
    else await page.mouse.click(2, 2);
    await expect(dialog).toHaveCount(0);
    await expect(count).toHaveText("0");
    await expect(trigger).toBeFocused();
  }
  await trigger.click();
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  const duringClose = await dialog.evaluate(async element => {
    Array.from(element.querySelectorAll("button")).find(button => button.textContent === "Xóa")!.click();
    const counts = [];
    while (element.isConnected) {
      await new Promise(requestAnimationFrame);
      if (element.isConnected) counts.push(document.querySelector("output")!.textContent);
    }
    return counts;
  });
  expect(duringClose.length).toBeGreaterThan(1);
  expect(duringClose.every(count => count === "0")).toBe(true);
  await expect(count).toHaveText("1");
});

test("closing a confirmation above another popup keeps the parent modal and restores focus", async ({ page }) => {
  await page.goto("/dialog-test");
  await page.getByRole("button", { name: "Open popup", exact: true }).click();
  const parent = page.getByRole("dialog", { name: "Shared popup", exact: true });
  const trigger = parent.getByRole("button", { name: "Request nested deletion" });
  await trigger.click();
  const confirmation = page.getByRole("dialog", { name: "Xác nhận xóa" });
  await expect(confirmation).toHaveAttribute("data-popup-phase", "open");
  await page.keyboard.press("Escape");
  await expect(confirmation).toHaveCount(0);
  await expect(parent).toBeVisible();
  expect(await parent.evaluate(element => element.matches(":modal"))).toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel("Confirmed deletions")).toHaveText("0");
  await page.keyboard.press("Escape");
  await expect(parent).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("shared popup retains its modal until a controlled close finishes and supports reopening", async ({ page }) => {
  await page.goto("/dialog-test");
  const trigger = page.getByRole("button", { name: "Open popup", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Shared popup", exact: true });
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  const frames = await page.evaluate(async () => {
    const dialog = document.querySelector("dialog")!;
    Array.from(document.querySelectorAll("button")).find(button => button.textContent === "External close")!.click();
    const frames = [];
    while (dialog.isConnected) {
      await new Promise(requestAnimationFrame);
      if (!dialog.isConnected) break;
      frames.push({ height: dialog.getBoundingClientRect().height, hidden: getComputedStyle(dialog.querySelector("[data-popup-content]")!).visibility === "hidden", modal: dialog.matches(":modal"), locked: document.body.style.overflow === "hidden" });
    }
    return frames;
  });
  expect(frames.length).toBeGreaterThan(1);
  expect(frames.every(frame => frame.hidden && frame.modal && frame.locked)).toBe(true);
  expect(frames.at(-1)!.height).toBeLessThan(frames[0].height - 10);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  await page.evaluate(() => Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Reopen while closing")!.click());
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  await expect(dialog.getByRole("button", { name: "Close popup" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("tall shared popup clips during motion, scrolls after opening and remains bounded on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/dialog-test");
  await page.getByRole("button", { name: "Change size" }).click();
  const samples = await page.getByRole("button", { name: "Open popup", exact: true }).evaluate(async button => {
    (button as HTMLButtonElement).click();
    const samples = [];
    for (let i = 0; i < 32; i++) {
      await new Promise(requestAnimationFrame);
      const dialog = document.querySelector<HTMLElement>("dialog")!;
      const frame = dialog.querySelector<HTMLElement>("[data-popup-frame]")!;
      samples.push({ phase: dialog.dataset.popupPhase, height: dialog.getBoundingClientRect().height, overflow: getComputedStyle(frame).overflowY, hidden: getComputedStyle(dialog.querySelector("[data-popup-content]")!).visibility === "hidden" });
    }
    return samples;
  });
  expect(samples.every(sample => sample.height <= 608)).toBe(true);
  const opening = samples.filter(sample => sample.phase === "opening");
  expect(opening.length).toBeGreaterThan(1);
  expect(opening.every(sample => sample.hidden && sample.overflow === "hidden")).toBe(true);
  expect(samples.at(-1)).toMatchObject({ phase: "open", hidden: false, overflow: "auto" });
  const frame = page.locator("[data-popup-frame]");
  await frame.hover();
  await page.mouse.wheel(0, 150);
  await expect.poll(() => frame.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await page.mouse.click(2, 2);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});
