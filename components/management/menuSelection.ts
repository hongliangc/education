type MenuItemWithHref = {
  key: string;
  href: string;
};

export function resolveSelectedMenuKey(
  pathname: string,
  menuItems: MenuItemWithHref[],
  fallbackKey: string,
): string {
  let bestMatch: MenuItemWithHref | undefined;

  for (const item of menuItems) {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!bestMatch || item.href.length > bestMatch.href.length)) {
      bestMatch = item;
    }
  }

  return bestMatch?.key ?? fallbackKey;
}
