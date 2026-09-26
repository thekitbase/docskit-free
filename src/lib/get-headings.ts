import GithubSlugger from "github-slugger";
import type {
  InlineCode,
  Heading as MdastHeading,
  PhrasingContent,
  Root,
  Text,
} from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type Heading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export async function extractHeadingsFromSource(
  source: string,
): Promise<Heading[]> {
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();

  const tree = unified().use(remarkParse).use(remarkGfm).parse(source) as Root;

  visit(tree, "heading", (node: MdastHeading) => {
    if (node.depth !== 2 && node.depth !== 3) return;
    const text = (node.children as PhrasingContent[])
      .filter(
        (c): c is Text | InlineCode =>
          c.type === "text" || c.type === "inlineCode",
      )
      .map((c) => c.value)
      .join("");
    const id = slugger.slug(text);
    headings.push({ id, text, level: node.depth as 2 | 3 });
  });

  return headings;
}
