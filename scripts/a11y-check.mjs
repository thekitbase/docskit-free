#!/usr/bin/env node
/**
 * Accessibility check for this template.
 *
 *   npm run build
 *   npm run test:a11y
 *
 * First run only: npx playwright install chromium
 *
 * Starts the production server, then visits every route listed in
 * a11y.config.mjs at desktop and mobile widths, in every theme the template
 * ships. On each page it runs two checks:
 *
 *   1. axe-core with the WCAG 2.0/2.1/2.2 A + AA rules and axe's best-practice
 *      rules (landmarks, heading order, one h1 per page). Where axe can't
 *      work out a contrast ratio on its own (text over a gradient, an image,
 *      or a pseudo-element), the check measures it from the rendered pixels.
 *   2. A keyboard pass that tabs through the page and fails any element that
 *      receives focus without a visible change (outline, ring, border,
 *      background, colour, or underline). axe does not test this.
 *
 * Exits 1 if anything fails, so it can gate CI or a coding agent's edit.
 *
 * Demo apps behind a sign-in page can set `signIn: { route, steps }` in the
 * config. That flow runs once and the localStorage it leaves behind (the demo
 * session) is seeded into every page that follows, except routes listed in
 * `signIn.publicRoutes`, which are checked signed out.
 *
 * Options:
 *   A11Y_BASE_URL=http://localhost:3000   check a server that is already running
 *   --route /pricing                      check one route (repeatable)
 *   --json a11y-report.json               also write the full results as JSON
 *
 * Source of truth: templates/_shared/a11y/a11y-check.mjs in the TheKitBase
 * monorepo. Edit it there and copy it into each template's scripts/ folder.
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const AXE_VERSION = require("axe-core/package.json").version;
const AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];
const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

const args = process.argv.slice(2);
const onlyRoutes = args.flatMap((a, i) =>
  a === "--route" ? [args[i + 1]] : [],
);
const jsonIndex = args.indexOf("--json");
const jsonPath = jsonIndex === -1 ? null : args[jsonIndex + 1];

const root = process.cwd();
const config = (
  await import(pathToFileURL(path.join(root, "a11y.config.mjs")).href)
).default;
const port = Number(process.env.A11Y_PORT ?? 3199);
const baseUrl = process.env.A11Y_BASE_URL ?? `http://localhost:${port}`;
const themes = config.themes?.values ?? ["default"];
const viewports = config.viewports ?? Object.keys(VIEWPORTS);
const routes = onlyRoutes.length ? onlyRoutes : config.routes;

async function startServer() {
  if (process.env.A11Y_BASE_URL) return null;
  const [cmd, ...cmdArgs] = (
    config.startCommand ?? ["npx", "next", "start", "-p", "{port}"]
  ).map((part) => part.replace("{port}", String(port)));
  const server = spawn(cmd, cmdArgs, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stdout.on("data", (d) => {
    output += d;
  });
  server.stderr.on("data", (d) => {
    output += d;
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `Server exited before it was ready. Did you run the build?\n${output}`,
      );
    }
    try {
      await fetch(baseUrl);
      return server;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  server.kill();
  throw new Error(
    `Server did not respond at ${baseUrl} within 60s.\n${output}`,
  );
}

/** Run the config's sign-in flow once and keep the localStorage it writes. */
let sessionStorageSeed = {};
async function captureSignIn(browser) {
  if (!config.signIn) return;
  const page = await newPage(browser, "desktop", themes[0]);
  await page.goto(new URL(config.signIn.route, baseUrl).href, {
    waitUntil: "networkidle",
  });
  await runSteps(page, config.signIn.steps);
  await page.waitForLoadState("networkidle");
  sessionStorageSeed = await page.evaluate(() => ({ ...localStorage }));
  if (config.themes?.storageKey)
    delete sessionStorageSeed[config.themes.storageKey];
  await page.context().close();
}

/**
 * Seed localStorage (theme + any demo state) before any page script runs.
 * Routes listed in signIn.publicRoutes are visited signed out, since a signed-in
 * visitor is often redirected away from them (the homepage, /login).
 */
function storageFor(theme, route) {
  const signedOut = config.signIn?.publicRoutes?.includes(route);
  const storage = {
    ...(signedOut ? {} : sessionStorageSeed),
    ...(config.storage ?? {}),
  };
  if (config.themes?.storageKey) storage[config.themes.storageKey] = theme;
  return storage;
}

async function newPage(browser, viewport, theme, route) {
  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    colorScheme: theme === "dark" ? "dark" : "light",
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    (storage) => {
      try {
        for (const [key, value] of Object.entries(storage))
          localStorage.setItem(key, value);
      } catch {}
    },
    storageFor(theme, route),
  );
  return context.newPage();
}

/** Scroll the whole page so lazy images and scroll-reveal sections render. */
async function settle(page) {
  await page.evaluate(async () => {
    // behavior "instant" overrides a page's scroll-behavior: smooth, which
    // would otherwise only start an animated scroll at each step.
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    // Jump entrance animations to their end state so nothing is measured
    // mid-fade. Infinite ones (marquees) can't finish and are left running.
    for (const animation of document.getAnimations()) {
      try {
        animation.finish();
      } catch {}
    }
  });
  await page.waitForTimeout(400);
}

async function runSteps(page, steps = []) {
  for (const step of steps) {
    if (step.click) await page.click(step.click);
    if (step.press) await page.keyboard.press(step.press);
    if (step.fill) await page.fill(step.fill[0], step.fill[1]);
    await page.waitForTimeout(step.wait ?? 350);
  }
  // Whatever a step opened (a drawer, a panel) gets measured at rest.
  if (steps.length) {
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        try {
          animation.finish();
        } catch {}
      }
    });
  }
}

async function axeScan(page) {
  const result = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .disableRules(Object.keys(config.disableRules ?? {}))
    .analyze();
  const shape = (v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({
      target: n.target.join(" "),
      selector: n.target.length === 1 ? n.target[0] : null,
      summary: n.failureSummary,
      reason: n.any?.[0]?.data?.messageKey ?? null,
    })),
  });
  const violations = result.violations.map(shape);
  // "incomplete" is what axe could not decide on its own: text over a
  // gradient, a pseudo-element, or an image. Contrast there is measured from
  // the rendered pixels instead; anything still unmeasurable is left for review.
  const review = [];
  const rendered = [];
  for (const item of result.incomplete.map(shape)) {
    if (item.rule !== "color-contrast") {
      review.push(item);
      continue;
    }
    // axe leaves text that is exactly its background colour (1:1) undecided in
    // case it is hidden on purpose. On screen it is simply invisible, and
    // there are no glyph pixels to measure, so it fails here.
    const invisible = item.nodes.filter((n) => n.reason === "equalRatio");
    if (invisible.length) {
      violations.push({
        rule: "color-contrast-invisible",
        impact: "serious",
        help: "Text is the same colour as its background, so it cannot be seen",
        nodes: invisible,
      });
    }
    const { failing, unresolved, measured } = await measureIncomplete(
      page,
      item.nodes.filter((n) => n.reason !== "equalRatio"),
    );
    if (failing.length) {
      violations.push({
        rule: "color-contrast-rendered",
        impact: "serious",
        help: "Text contrast measured from the rendered page is below WCAG AA",
        nodes: failing,
      });
    }
    if (unresolved.length) review.push({ ...item, nodes: unresolved });
    rendered.push(...measured);
  }
  return { violations, review, evidence: summariseEvidence(result, rendered) };
}

/**
 * What passed, for the --json report: the axe rules this page passed, and every
 * contrast measurement (axe's own and the rendered-pixel ones) reduced to a count
 * and the closest call, i.e. the lowest ratio relative to what WCAG requires.
 */
function summariseEvidence(result, rendered) {
  const fromAxe = (
    result.passes.find((r) => r.id === "color-contrast")?.nodes ?? []
  )
    .map((n) => ({
      target: n.target.join(" "),
      ratio: n.any?.[0]?.data?.contrastRatio,
      required: Number.parseFloat(n.any?.[0]?.data?.expectedContrastRatio),
    }))
    .filter((m) => m.ratio && m.required);
  const all = [
    ...fromAxe.map((m) => ({ ...m, source: "axe" })),
    ...rendered.map((m) => ({ ...m, source: "rendered" })),
  ];
  const closest = all.reduce(
    (low, m) =>
      !low || m.ratio / m.required < low.ratio / low.required ? m : low,
    null,
  );
  return {
    rulesPassed: result.passes.map((r) => r.id),
    contrastMeasured: fromAxe.length,
    contrastRendered: rendered.length,
    lowestContrast: closest && {
      ...closest,
      ratio: Math.round(closest.ratio * 100) / 100,
    },
  };
}

// ── Rendered contrast ──────────────────────────────────────────────────────

/** Decode an 8-bit, non-interlaced RGB/RGBA PNG, which is what Chromium's screenshots are. */
function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const chunks = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      channels = data[9] === 6 ? 4 : 3;
    } else if (type === "IDAT") {
      chunks.push(data);
    }
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++)
    unfilterRow(raw, pixels, y, stride, channels);
  return { width, height, channels, pixels };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function unfilterRow(raw, pixels, y, stride, channels) {
  const filter = raw[y * (stride + 1)];
  for (let x = 0; x < stride; x++) {
    const left = x >= channels ? pixels[y * stride + x - channels] : 0;
    const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
    const upLeft =
      y > 0 && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
    const predictor = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][
      filter
    ];
    pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + predictor) & 0xff;
  }
}

/** True when `shown` lies on the line from `bg` toward `text` (a glyph or its anti-aliased edge). */
function isGlyphPixel(shown, bg, text) {
  const v = text.map((c, k) => c - bg[k]);
  const w = shown.map((c, k) => c - bg[k]);
  const vv = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  if (vv < 1) return false;
  const t = (w[0] * v[0] + w[1] * v[1] + w[2] * v[2]) / vv;
  if (t < 0.2) return false;
  const residual = Math.hypot(
    w[0] - t * v[0],
    w[1] - t * v[1],
    w[2] - t * v[2],
  );
  return residual <= 0.35 * Math.sqrt(vv);
}

function luminance([r, g, b]) {
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The colours an element's text is painted in, as sRGB plus effective alpha,
 * and whether it counts as large text. Runs in the page.
 */
function resolveTextColors(node) {
  const style = getComputedStyle(node);
  let opacity = 1;
  for (let n = node; n; n = n.parentElement)
    opacity *= Number(getComputedStyle(n).opacity);
  // Let the browser resolve any colour syntax (oklch, color-mix...) to sRGB.
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const toRgba = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  // Gradient text (background-clip: text) is painted by the background of the
  // element that sets it, which may be an ancestor whose transparent colour
  // this element inherits. Every stop in that gradient is a text colour.
  const clipsText = (s) =>
    s.backgroundClip === "text" || s.webkitBackgroundClip === "text";
  let painter = node;
  while (painter && !clipsText(getComputedStyle(painter)))
    painter = painter.parentElement;
  const stops = painter
    ? getComputedStyle(painter).backgroundImage.match(
        /(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)/g,
      )
    : [style.color];
  const size = Number.parseFloat(style.fontSize) || 0;
  return {
    colors: (stops ?? []).map(toRgba).map(([r, g, b, a]) => ({
      rgb: [r, g, b],
      alpha: (a / 255) * opacity,
    })),
    large: size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700),
  };
}

/**
 * Tag the element to probe and any gradient text that paints it (the element,
 * a descendant, or the ancestor whose gradient draws its glyphs), which has to
 * lose its background to disappear. Runs in the page.
 */
function markProbeAndGradientText(node) {
  node.setAttribute("data-a11y-probe", "");
  const clips = (el) => {
    const s = getComputedStyle(el);
    return s.backgroundClip === "text" || s.webkitBackgroundClip === "text";
  };
  for (const el of node.querySelectorAll("*")) {
    if (clips(el)) el.setAttribute("data-a11y-cliptext", "");
  }
  let painter = node;
  while (painter && !clips(painter)) painter = painter.parentElement;
  painter?.setAttribute("data-a11y-cliptext", "");
}

/**
 * Tag fixed or sticky layers painted above the element. Layers behind it (a
 * fixed scrim under a translucent panel) are part of what the text is read
 * against, so they stay. Runs in the page.
 */
function markOverlaysAbove(node) {
  const rect = node.getBoundingClientRect();
  const coverOf = (el) => {
    for (
      let layer = el;
      layer && !layer.contains(node);
      layer = layer.parentElement
    ) {
      const position = getComputedStyle(layer).position;
      if (position === "fixed" || position === "sticky") return layer;
    }
    return null;
  };
  for (const fx of [0.1, 0.5, 0.9]) {
    for (const fy of [0.15, 0.5, 0.85]) {
      const stack = document.elementsFromPoint(
        rect.left + rect.width * fx,
        rect.top + rect.height * fy,
      );
      const own = stack.findIndex(
        (el) => el === node || el.contains(node) || node.contains(el),
      );
      const above = own === -1 ? stack : stack.slice(0, own);
      for (const el of above)
        coverOf(el)?.setAttribute("data-a11y-overlay", "");
    }
  }
}

/** Two decoded screenshots of the same element show the same frame. */
function samePixels(a, b) {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let i = 0; i < a.pixels.length; i++)
    if (Math.abs(a.pixels[i] - b.pixels[i]) > 8) return false;
  return true;
}

/**
 * The element's text line boxes, relative to its own box, in CSS pixels. Glyphs
 * can only be drawn inside them. Runs in the page.
 */
function textBoxes(element) {
  const box = element.getBoundingClientRect();
  const rects = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(walker.currentNode);
    for (const r of range.getClientRects()) {
      rects.push([
        r.left - box.left,
        r.top - box.top,
        r.right - box.left,
        r.bottom - box.top,
      ]);
    }
  }
  return { width: box.width, rects };
}

/**
 * Contrast at every glyph pixel: pixels inside the text's line boxes that
 * changed between the shot with text and the shot without it, and that lie on
 * the line from the background toward the text colour. Keeping to the line
 * boxes matters for small text: a shape edge (an avatar circle) that lands a
 * sub-pixel apart in the two shots would otherwise read as glyph pixels
 * measured against whatever is behind the shape. Returns the ratios sorted
 * ascending, or null.
 */
function glyphRatios(withText, withoutText, colors, boxes) {
  const { width, height, channels } = withoutText;
  if (withText.width !== width || withText.height !== height) return null;
  const a = withText.pixels;
  const b = withoutText.pixels;
  // Line boxes in screenshot pixels, padded by one pixel for anti-aliasing.
  const scale = boxes?.rects.length && boxes.width ? width / boxes.width : 0;
  const inText = scale
    ? (x, y) =>
        boxes.rects.some(
          ([l, t, r, btm]) =>
            x >= l * scale - 1 &&
            x <= r * scale + 1 &&
            y >= t * scale - 1 &&
            y <= btm * scale + 1,
        )
    : () => true;
  const ratios = [];
  for (let i = 0; i < width * height * channels; i += channels) {
    const pixel = i / channels;
    if (!inText(pixel % width, Math.floor(pixel / width))) continue;
    const diff =
      Math.abs(a[i] - b[i]) +
      Math.abs(a[i + 1] - b[i + 1]) +
      Math.abs(a[i + 2] - b[i + 2]);
    if (diff < 24) continue;
    const ratio = glyphPixelRatio(
      [a[i], a[i + 1], a[i + 2]],
      [b[i], b[i + 1], b[i + 2]],
      colors,
    );
    if (ratio !== null) ratios.push(ratio);
  }
  return ratios.length ? ratios.sort((x, y) => x - y) : null;
}

/** Worst contrast across the text colours this pixel could be drawn in, or null if it isn't a glyph pixel. */
function glyphPixelRatio(shown, bg, colors) {
  let worst = null;
  for (const { rgb, alpha } of colors) {
    const text = rgb.map((c, k) => c * alpha + bg[k] * (1 - alpha));
    if (isGlyphPixel(shown, bg, text)) {
      const ratio = contrast(text, bg);
      worst = worst === null ? ratio : Math.min(worst, ratio);
    }
  }
  return worst;
}

/**
 * Measure the contrast of an element's text against what is actually drawn
 * behind each glyph, so gradients, images and pseudo-element backgrounds are
 * covered. Returns the 5th-percentile ratio across glyph pixels (the near-worst
 * spot, ignoring a few stray edge pixels) and the WCAG AA threshold for the text size.
 */
async function renderedContrast(page, selector) {
  const element = page.locator(selector).first();
  if (!(await element.count())) return null;
  await element.scrollIntoViewIfNeeded().catch(() => {});
  const info = await element.evaluate(resolveTextColors);
  const boxes = await element.evaluate(textBoxes);
  await element.evaluate(markProbeAndGradientText);
  await element.evaluate(markOverlaysAbove);
  if (!info.colors.length) return null;
  // Two shots of the same box: A with the text, B with the text made
  // transparent. Pixels that differ are where glyphs are drawn, and B holds the
  // real background behind each of them. Dots, icons and borders inside the
  // element are identical in both shots, so they never count as background.
  // Transitions stay off for everything the probe touches until its styles
  // are gone, or text would still be fading back in when the next element is
  // measured.
  const overlays = await page.addStyleTag({
    content:
      // Icons inside the element are hidden in both shots: they follow
      // currentColor, so they would otherwise read as glyphs.
      "[data-a11y-overlay],[data-a11y-probe] svg{visibility:hidden!important}[data-a11y-probe],[data-a11y-probe] *,[data-a11y-overlay],[data-a11y-cliptext]{transition:none!important}",
  });
  let withText;
  let withoutText;
  try {
    // The page must be still: take the text shot until two in a row match, or
    // give up (left for review) rather than compare shots of different frames.
    const shot = async () =>
      decodePng(
        await element.screenshot({ animations: "disabled", timeout: 5000 }),
      );
    withText = await shot();
    for (let tries = 0; ; tries++) {
      const again = await shot();
      if (samePixels(withText, again)) break;
      if (tries === 2) return null;
      withText = again;
    }
    const hideText = await page.addStyleTag({
      content:
        "[data-a11y-probe],[data-a11y-probe] *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important}[data-a11y-cliptext]{background:none!important}",
    });
    withoutText = decodePng(
      await element.screenshot({ animations: "disabled", timeout: 5000 }),
    );
    // Restore the text while transitions are still off. Reading layout forces
    // the style recalc now, before the transition rule goes away with it.
    await hideText.evaluate((node) => {
      node.remove();
      document.body.getBoundingClientRect();
    });
  } catch {
    return null;
  } finally {
    await page.evaluate(() => {
      for (const el of document.querySelectorAll(
        "[data-a11y-probe],[data-a11y-cliptext],[data-a11y-overlay]",
      )) {
        el.removeAttribute("data-a11y-probe");
        el.removeAttribute("data-a11y-cliptext");
        el.removeAttribute("data-a11y-overlay");
      }
    });
    await overlays.evaluate((node) => {
      node.remove();
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }
    });
  }
  const ratios = glyphRatios(withText, withoutText, info.colors, boxes);
  if (!ratios) return null;
  return {
    ratio: ratios[Math.floor(ratios.length * 0.05)],
    required: info.large ? 3 : 4.5,
  };
}

async function measureIncomplete(page, nodes) {
  const failing = [];
  const unresolved = [];
  const measured = [];
  for (const node of nodes) {
    // Symbol-only content (arrows, bullets, icon glyphs) isn't text to read.
    const symbolOnly = node.summary?.includes("only non-text characters");
    const result =
      symbolOnly || !node.selector
        ? null
        : await renderedContrast(page, node.selector);
    if (!result) unresolved.push(node);
    else measured.push({ target: node.target, ...result });
    if (result && result.ratio < result.required) {
      failing.push({
        ...node,
        summary: `Rendered contrast ${result.ratio.toFixed(2)}:1, needs ${result.required}:1`,
      });
    }
  }
  return { failing, unresolved, measured };
}

/** A readable path for the focused element, or null when nothing is focused. */
function describeActiveElement() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const parts = [];
  for (let node = el; node && node !== document.body && parts.length < 4; ) {
    const label = node.getAttribute("aria-label")?.slice(0, 40);
    const id = node.id ? `#${node.id}` : "";
    parts.unshift(
      `${node.tagName.toLowerCase()}${id}${label ? `[aria-label="${label}"]` : ""}`,
    );
    node = node.parentElement;
  }
  const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  return text ? `${parts.join(" > ")} "${text}"` : parts.join(" > ");
}

/**
 * Compare the focused element (and its parent and next sibling, which often
 * carry a focus-within or peer-focus ring) with focus on and off, and check the
 * element can actually be seen. Runs in the page, so it must stay self-contained.
 */
function inspectFocusIndicator() {
  const el = document.activeElement;
  const props = [
    "outlineStyle",
    "outlineWidth",
    "outlineColor",
    "boxShadow",
    "backgroundColor",
    "borderTopColor",
    "borderBottomColor",
    "borderBottomWidth",
    "color",
    "textDecorationLine",
    "opacity",
  ];
  const snapshot = () =>
    [el, el.parentElement, el.nextElementSibling]
      .filter(Boolean)
      .map((node) => props.map((p) => getComputedStyle(node)[p]).join("|"))
      .join("||");
  const rect = el.getBoundingClientRect();
  // checkVisibility covers opacity/visibility set on any ancestor (a closed
  // menu faded out with opacity-0). Off-canvas drawers parked with translate-x
  // sit outside the viewport horizontally, which is just as invisible.
  const hidden =
    rect.width === 0 ||
    rect.height === 0 ||
    rect.right <= 0 ||
    rect.left >= window.innerWidth ||
    !el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  // Inputs styled as sr-only show focus on their label instead.
  const visuallyHiddenInput =
    hidden && el.tagName === "INPUT" && el.labels?.length > 0;
  const focused = snapshot();
  el.blur();
  const blurred = snapshot();
  el.focus();
  return {
    hidden: hidden && !visuallyHiddenInput,
    visible: focused !== blurred || visuallyHiddenInput,
  };
}

/**
 * Tab through the page and flag any focus stop with no visible indicator.
 */
async function focusScan(page, maxStops) {
  // Focus styles are read the instant focus moves, so transitions must be off
  // or a ring that fades in would read as no change at all.
  const noTransitions = await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important}",
  });
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.activeElement?.blur?.();
  });
  const failures = [];
  const seen = new Set();
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press("Tab");
    const id = await page.evaluate(describeActiveElement);
    if (!id) continue;
    const stop = { id, ...(await page.evaluate(inspectFocusIndicator)) };
    if (seen.has(stop.id)) break;
    seen.add(stop.id);
    if (stop.hidden)
      failures.push({
        target: stop.id,
        problem: "receives focus while not visible",
      });
    else if (!stop.visible)
      failures.push({ target: stop.id, problem: "no visible focus indicator" });
  }
  await noTransitions.evaluate((node) => node.remove());
  return { stops: seen.size, failures };
}

function label(viewport, theme, route, state) {
  const themePart = theme === "default" ? "" : ` ${theme}`;
  return `${route}${state ? ` [${state}]` : ""} (${viewport}${themePart})`;
}

/** Check one route/state in one viewport and theme. Returns true on a pass. */
async function checkJob(page, job) {
  const name = label(job.viewport, job.theme, job.route, job.state?.name);
  try {
    const response = await page.goto(new URL(job.route, baseUrl).href, {
      waitUntil: "networkidle",
    });
    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status() ?? "no response"}`);
    }
    await settle(page);
    // Measuring scrolls each element into view between screenshots. A smooth
    // scroll would still be moving when the next shot is taken.
    await page.addStyleTag({ content: "*{scroll-behavior:auto!important}" });
    await runSteps(page, job.state?.steps);
    const { violations, review, evidence } = await axeScan(page);
    const focus = job.state
      ? { stops: 0, failures: [] }
      : await focusScan(page, config.maxFocusStops ?? 80);
    report.pages.push({
      ...job,
      state: job.state?.name,
      violations,
      review,
      focus,
      evidence,
    });
    reviewCount += review.reduce((sum, v) => sum + v.nodes.length, 0);
    if (!violations.length && !focus.failures.length) {
      console.info(`pass ${name} (${focus.stops} focus stops)`);
      return true;
    }
    console.error(`\nFAIL ${name}`);
    for (const v of violations) {
      console.error(`  [${v.impact}] ${v.rule}: ${v.help}`);
      for (const n of v.nodes.slice(0, 6)) console.error(`      ${n.target}`);
      if (v.nodes.length > 6)
        console.error(`      ...and ${v.nodes.length - 6} more`);
    }
    for (const f of focus.failures)
      console.error(`  [focus] ${f.problem}: ${f.target}`);
  } catch (error) {
    report.pages.push({ ...job, state: job.state?.name, error: String(error) });
    console.error(`\nERROR ${name}: ${error.message}`);
  }
  return false;
}

const server = await startServer();
const browser = await chromium.launch();
const report = {
  axeVersion: AXE_VERSION,
  tags: AXE_TAGS,
  checkedAt: new Date().toISOString(),
  pages: [],
};
let failed = 0;
let reviewCount = 0;

try {
  await captureSignIn(browser);
  const jobs = [];
  for (const viewport of viewports)
    for (const theme of themes)
      for (const route of routes) jobs.push({ viewport, theme, route });
  if (!onlyRoutes.length) {
    for (const state of config.states ?? []) {
      for (const viewport of state.viewports ?? viewports)
        for (const theme of themes)
          jobs.push({ viewport, theme, route: state.route, state });
    }
  }

  for (const job of jobs) {
    const page = await newPage(browser, job.viewport, job.theme, job.route);
    try {
      if (!(await checkJob(page, job))) failed++;
    } finally {
      await page.context().close();
    }
  }
} finally {
  await browser.close();
  server?.kill();
}

if (jsonPath) writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
const total = report.pages.length;
console.info(
  `\n${total - failed}/${total} checks passed (axe-core ${AXE_VERSION}, ${AXE_TAGS.join(", ")})`,
);
if (reviewCount) {
  console.info(
    `${reviewCount} element(s) could not be measured automatically (mostly icon glyphs). Run with --json and check "review".`,
  );
}
process.exit(failed ? 1 : 0);
