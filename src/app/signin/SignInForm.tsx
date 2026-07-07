"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { requestOtp } from "./actions";

export function SignInForm() {
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTo = useSearchParams().get("redirectTo") ?? "/me";

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
        Passwordless access
      </p>
      <h1 className="mb-2 text-2xl font-black">Sign in to RunZW</h1>
      <p className="mb-5 text-sm leading-6 text-[color:var(--muted)]">
        Use your email or Zimbabwean phone number. We&apos;ll send a short code.
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {!sent ? (
        <form
          action={async (fd) => {
            const r = await requestOtp(fd);
            if ("error" in r && r.error) {
              setError(r.error);
              return;
            }
            if (!("contact" in r) || !r.contact) return;
            setError(null);
            setContact(r.contact);
            setSent(true);
          }}
          className="space-y-3"
        >
          <input
            name="contact"
            placeholder="Email or phone"
            required
            className="field"
          />
          <button className="button-primary w-full">
            Send code
          </button>
        </form>
      ) : (
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.currentTarget);
            await signIn("otp", {
              contact,
              code: String(fd.get("code") ?? ""),
              name: String(fd.get("name") ?? ""),
              redirectTo,
            });
          }}
          className="space-y-3"
        >
          <input
            name="name"
            placeholder="Your name"
            required
            className="field"
          />
          <input
            name="code"
            placeholder="6-digit code"
            required
            className="field"
          />
          <button className="button-primary w-full">
            Verify
          </button>
        </form>
      )}
    </>
  );
}
