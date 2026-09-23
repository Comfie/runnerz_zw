"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="min-h-9 rounded-full px-3 font-bold text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
      onClick={() => signOut({ redirectTo: "/" })}
      type="button"
    >
      Sign out
    </button>
  );
}
