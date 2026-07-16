"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { requestOtp } from "./actions";

export function SignInForm() {
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
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
        <>
        <form
          action={async (fd) => {
            if (sending) return;
            setSending(true);
            const r = await requestOtp(fd);
            setSending(false);
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
          <button className="button-primary w-full" disabled={sending}>
            {sending ? "Sending…" : "Send code"}
          </button>
        </form>
        <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">
          One account for everything — registering for races, your race
          history, and club management.
        </p>
        <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
          Organising a race? Sign in the same way, then{" "}
          <Link
            href="/organiser/apply"
            className="font-bold text-[color:var(--teal-dark)]"
          >
            apply to list your club&apos;s events
          </Link>
          .
        </p>
        </>
      ) : (
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (verifying) return;
            setVerifying(true);
            const fd = new FormData(ev.currentTarget);
            try {
              await signIn("otp", {
                contact,
                code: String(fd.get("code") ?? ""),
                name: String(fd.get("name") ?? ""),
                redirectTo,
              });
            } catch {
              setVerifying(false);
            }
          }}
          className="space-y-3"
        >
          <input
            name="name"
            placeholder="Your name (first sign-in only)"
            required
            className="field"
          />
          <input
            name="code"
            placeholder="6-digit code"
            required
            className="field"
          />
          <button className="button-primary w-full" disabled={verifying}>
            {verifying ? "Verifying…" : "Verify"}
          </button>
        </form>
      )}
    </>
  );
}
