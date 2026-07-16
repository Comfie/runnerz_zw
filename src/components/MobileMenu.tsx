"use client";

import type { HeaderNavItem } from "@/lib/header";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";

export function MobileMenu({
  items,
  signedIn,
}: {
  items: HeaderNavItem[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative sm:hidden">
      <button
        aria-expanded={open}
        aria-label="Open navigation menu"
        className="inline-grid size-10 place-items-center rounded-full border border-[color:var(--line)] bg-white/80 shadow-sm"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="flex flex-col gap-1" aria-hidden="true">
          <span className="block h-0.5 w-5 rounded-full bg-[color:var(--foreground)]" />
          <span className="block h-0.5 w-5 rounded-full bg-[color:var(--foreground)]" />
          <span className="block h-0.5 w-5 rounded-full bg-[color:var(--foreground)]" />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-64 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-2 shadow-[var(--shadow-soft)]">
          {items.map((item) => (
            <Link
              className="block rounded-xl px-4 py-3 text-sm font-bold text-[color:var(--foreground)] hover:bg-[rgba(30,142,62,0.08)]"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {signedIn && (
            <button
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-[color:var(--foreground)] hover:bg-[rgba(30,142,62,0.08)]"
              onClick={() => signOut({ redirectTo: "/" })}
              type="button"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
