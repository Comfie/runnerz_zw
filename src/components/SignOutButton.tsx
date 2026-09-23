"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="min-h-9 rounded-full px-3 font-bold text-[color:var(--cream)]/60 transition hover:text-[color:var(--cream)]"
      onClick={() => signOut({ redirectTo: "/" })}
      type="button"
    >
      Sign out
    </button>
  );
}
