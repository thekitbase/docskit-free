import { extractHeadingsFromSource } from "@/lib/get-headings";

describe("extractHeadingsFromSource", () => {
  it("returns empty array for content with no headings", async () => {
    const result = await extractHeadingsFromSource("Just a paragraph.");
    expect(result).toEqual([]);
  });

  it("extracts h2 headings with correct id and level", async () => {
    const source = "## Installation\n\nSome text.";
    const result = await extractHeadingsFromSource(source);
    expect(result).toEqual([
      { id: "installation", text: "Installation", level: 2 },
    ]);
  });

  it("extracts h3 headings with correct id and level", async () => {
    const source = "### Quick Start\n\nSome text.";
    const result = await extractHeadingsFromSource(source);
    expect(result).toEqual([
      { id: "quick-start", text: "Quick Start", level: 3 },
    ]);
  });

  it("extracts mixed h2 and h3 in order", async () => {
    const source =
      "## Getting Started\n\n### Prerequisites\n\n## Configuration";
    const result = await extractHeadingsFromSource(source);
    expect(result).toEqual([
      { id: "getting-started", text: "Getting Started", level: 2 },
      { id: "prerequisites", text: "Prerequisites", level: 3 },
      { id: "configuration", text: "Configuration", level: 2 },
    ]);
  });

  it("ignores h1 headings", async () => {
    const source = "# Title\n\n## Section";
    const result = await extractHeadingsFromSource(source);
    expect(result).toEqual([{ id: "section", text: "Section", level: 2 }]);
  });

  it("handles headings with special characters", async () => {
    const source = "## What's New in v2.0";
    const result = await extractHeadingsFromSource(source);
    expect(result[0].id).toBe("whats-new-in-v20");
  });
});
