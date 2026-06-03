"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/products", label: "상품" },
  { href: "/orders", label: "주문" },
  { href: "/settings", label: "설정" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto max-w-5xl overflow-x-auto">
      <ul className="flex gap-1 px-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex items-center border-b-2 px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
