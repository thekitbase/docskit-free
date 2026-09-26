import { DocsPager } from "@/components/docs/DocsPager";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { mdxComponents } from "@/components/docs/mdx";
import { readContentFile } from "@/lib/get-content";
import { extractHeadingsFromSource } from "@/lib/get-headings";
import { getPager } from "@/lib/get-pager";
import { walkContentDir } from "@/lib/walk-content";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

type Params = { slug?: string[] };

const DEFAULT_SLUG = ["getting-started", "introduction"];

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = walkContentDir();
  return [{ slug: [] }, ...slugs.map((s) => ({ slug: s }))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug = DEFAULT_SLUG } = await params;
  const source = readContentFile(slug);
  if (!source) return {};

  const match = source.match(/^#\s+(.+)$/m);
  const title = match?.[1] ?? slug[slug.length - 1];

  return {
    title,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com"}/docs/${slug.join("/")}`,
    },
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug = DEFAULT_SLUG } = await params;
  const source = readContentFile(slug);
  if (!source) notFound();

  const headings = await extractHeadingsFromSource(source);
  const currentHref = `/docs/${slug.join("/")}`;
  const pager = getPager(currentHref);

  // Cast rehype plugins to avoid library type imprecision with tuple overloads.
  // Syntax highlighting (rehype-pretty-code + shiki) is DocsKit Pro only -
  // code blocks here render plain, still legible via the pre/code styles
  // in mdx/index.tsx, just without per-token colors.
  // biome-ignore lint/suspicious/noExplicitAny: rehype plugin tuple types don't line up with next-mdx-remote's expected type
  const rehypePlugins: any[] = [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "wrap" }],
  ];

  return (
    <div className="flex gap-8 py-8">
      <article className="min-w-0 flex-1 prose-headings:scroll-mt-20">
        <MDXRemote
          source={source}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins,
            },
          }}
          components={mdxComponents}
        />
        <DocsPager {...pager} />
      </article>
      <TableOfContents headings={headings} />
    </div>
  );
}
