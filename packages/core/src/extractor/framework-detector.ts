const FRAMEWORK_SIGNATURES: Record<string, (html: string) => boolean> = {
  "next.js": (html) =>
    html.includes("__next") || html.includes("_next/static"),
  react: (html) =>
    html.includes("data-reactroot") ||
    html.includes("_reactRootContainer") ||
    /\bid="root"\b/.test(html),
  "nuxt": (html) =>
    html.includes("__nuxt") || html.includes("_nuxt/"),
  vue: (html) =>
    html.includes("data-v-app") ||
    html.includes("data-v-") ||
    html.includes("id=\"app\""),
  angular: (html) =>
    html.includes("ng-version") || html.includes("_ngcontent"),
  sveltekit: (html) =>
    html.includes("data-sveltekit") || html.includes("__sveltekit"),
  svelte: (html) =>
    /class="s-[a-zA-Z0-9]+"/.test(html),
  gatsby: (html) =>
    html.includes("___gatsby"),
  remix: (html) =>
    html.includes("__remix"),
  astro: (html) =>
    html.includes("astro-") || html.includes("data-astro"),
};

export function detectFramework(html: string): string | null {
  for (const [name, test] of Object.entries(FRAMEWORK_SIGNATURES)) {
    if (test(html)) return name;
  }
  return null;
}
