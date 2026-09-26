import fs from "node:fs";
import path from "node:path";

export function walkContentDir(): string[][] {
  const docsDir = path.join(process.cwd(), "content", "docs");
  const slugs: string[][] = [];

  function walk(dir: string, prefix: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), [...prefix, entry.name]);
      } else if (entry.name.endsWith(".mdx")) {
        slugs.push([...prefix, entry.name.replace(/\.mdx$/, "")]);
      }
    }
  }

  if (fs.existsSync(docsDir)) walk(docsDir, []);
  return slugs;
}
