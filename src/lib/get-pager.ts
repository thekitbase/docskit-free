import { nav } from "@/config/nav";
import type { NavItem } from "@/config/nav";

export type PagerItem = { title: string; href: string };

export type Pager = {
  prev: PagerItem | null;
  next: PagerItem | null;
};

function flattenNav(): NavItem[] {
  return nav.flatMap((group) => group.items);
}

export function getPager(currentHref: string): Pager {
  const items = flattenNav();
  const index = items.findIndex((item) => item.href === currentHref);

  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
}
