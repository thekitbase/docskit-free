export type NavItem = {
  title: string;
  href: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const nav: NavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs/getting-started/introduction" },
      { title: "Installation", href: "/docs/getting-started/installation" },
      { title: "Quick Start", href: "/docs/getting-started/quick-start" },
      { title: "Customizing", href: "/docs/getting-started/customizing" },
    ],
  },
  {
    title: "Components",
    items: [
      { title: "Callout", href: "/docs/components/callout" },
      { title: "CodeBlock", href: "/docs/components/code-block" },
    ],
  },
];
