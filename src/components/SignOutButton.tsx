"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="button-primary min-h-9 px-3"
      onClick={() => signOut({ redirectTo: "/" })}
      type="button"
    >
      Sign out
    </button>
  );
}
