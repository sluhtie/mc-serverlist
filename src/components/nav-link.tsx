"use client";

import { usePathname } from "next/navigation";
import Link from "@/components/link";
import { delocalizePath } from "@/lib/i18n/config";

/** Header link that marks itself as the current section. */
export function NavLink({
  href,
  exact = false,
  className = "",
  children,
}: {
  href: string;
  /** Only active on exactly this path, not on its children. */
  exact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { path } = delocalizePath(usePathname());
  const active =
    exact ? path === href : href === "/" ? path === "/" || path.startsWith("/server/") : path.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
