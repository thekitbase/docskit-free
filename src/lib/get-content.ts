import fs from "node:fs";
import path from "node:path";

export function getContentPath(slugParts: string[]): string {
  return `${path.join(process.cwd(), "content", "docs", ...slugParts)}.mdx`;
}

export function readContentFile(slugParts: string[]): string | null {
  const filePath = getContentPath(slugParts);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}
