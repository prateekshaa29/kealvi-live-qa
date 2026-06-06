"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getVoterId } from "@/lib/voter";

const links = [
  { href: "/", label: "Q&A", icon: "💬" },
  { href: "/leaderboard", label: "Board", icon: "🏆" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
];

export default function AppNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(
          `/api/notifications?voterId=${encodeURIComponent(getVoterId())}`
        );
        const data = await res.json();
        setUnread(data.unreadCount ?? 0);
      } catch {
        /* ignore */
      }
    }
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Kealvi
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  pathname === link.href
                    ? "bg-brand-soft font-medium text-brand"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
                {link.href === "/notifications" && unread > 0 && (
                  <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="Mobile"
      >
        <div className="mx-auto flex max-w-2xl">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
                pathname === link.href
                  ? "font-medium text-brand"
                  : "text-muted"
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              {link.label}
              {link.href === "/notifications" && unread > 0 && (
                <span className="absolute mt-0.5 ml-6 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
