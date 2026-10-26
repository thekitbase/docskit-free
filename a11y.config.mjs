/**
 * Routes and states checked by `npm run test:a11y` (scripts/a11y-check.mjs).
 * Add new routes here when you add a page, and a state when you add a menu,
 * drawer, or dialog that only appears after a click.
 */
export default {
  // DocsKit Free is a static export, so the check serves the built out/ folder.
  startCommand: ["npx", "--yes", "serve", "out", "-l", "{port}"],
  routes: [
    "/",
    "/docs",
    "/docs/getting-started/installation",
    "/docs/getting-started/quick-start",
    "/docs/components/callout",
    "/docs/components/code-block",
  ],
  themes: { storageKey: "theme", values: ["light", "dark"] },
  states: [
    {
      name: "navigation drawer open",
      route: "/docs/getting-started/installation",
      viewports: ["mobile"],
      steps: [{ click: 'button[aria-label="Open navigation"]', wait: 500 }],
    },
  ],
};
