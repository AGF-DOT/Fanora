"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Explore" },
  { href: "/community/creations", label: "Echo" },
  { href: "/community#check-in", label: "Check In" },
  { href: "/community/tasks", label: "Quests" },
  { href: "/collections", label: "Gallery" },
  { href: "/collection", label: "Collection" },
];

function isItemActive(href: string, pathname: string) {
  const [path, hash] = href.split("#");
  // 带锚点的链接只在对应页面本身高亮，避免 /community 下所有子页面都亮起
  if (hash) return pathname === path;
  if (path === "/") return pathname === "/";
  // 子页面（如 /collection/xxx、/collections/create）也保持父级菜单高亮
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function Nav() {
  const pathname = usePathname();
  return (
    <>
      {navigation.map((item) => {
        const active = isItemActive(item.href, pathname);
        return (
          <li key={item.href} className="group">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex items-center justify-between py-3.5 font-display text-base text-jacarta-700 hover:text-accent focus:text-accent aria-[current=page]:text-accent dark:text-white dark:hover:text-accent dark:focus:text-accent lg:px-4 xl:px-5"
            >
              {item.label}
              <span
                className={`pointer-events-none absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-accent transition-opacity duration-200 xl:inset-x-5 ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                }`}
              />
            </Link>
          </li>
        );
      })}
    </>
  );
}
