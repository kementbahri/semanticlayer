import type { Page } from "playwright";

const HYDRATION_TIMEOUT_MS = 10_000;
const STABILIZATION_DELAY_MS = 500;

export async function waitForHydration(page: Page): Promise<void> {
  await Promise.race([
    waitForFrameworkHydration(page),
    sleep(HYDRATION_TIMEOUT_MS),
  ]);

  await sleep(STABILIZATION_DELAY_MS);
}

async function waitForFrameworkHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#root") ?? document.querySelector("#app");
      if (root && root.children.length > 1) return true;

      if (document.querySelector("[data-reactroot]")) return true;
      if (document.querySelector("#__next [data-reactroot], #__next main")) return true;

      if (document.querySelector("[data-v-app]")) return true;
      if (document.querySelector("#__nuxt main, #__nuxt .page")) return true;

      if (document.querySelector("[ng-version]")) return true;

      if (document.querySelector("[data-sveltekit-hydrate]")) return true;
      if (document.querySelector(".s-")) return true;

      const textLen = document.body.innerText.trim().length;
      return textLen > 200;
    },
    { timeout: HYDRATION_TIMEOUT_MS },
  ).catch(() => {});
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
