import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderNavigation } from "@/lib/header";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { MobileMenu } from "./MobileMenu";

export async function AppHeader() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; name?: string | null; email?: string | null; role?: string }
    | undefined;
  const club = user?.id
    ? await db.club.findUnique({
        where: { ownerId: user.id },
        select: { verified: true },
      })
    : null;
  const items = getHeaderNavigation(user ?? null, club);

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[rgba(251,252,248,0.86)] backdrop-blur">
      <nav className="app-container flex min-h-16 items-center justify-between gap-3 py-3 text-sm">
        <Link className="flex items-center gap-2 font-bold" href="/">
          <span className="grid size-9 place-items-center rounded-full bg-[color:var(--teal)] text-sm font-black text-white shadow-sm">
            RZ
          </span>
          <span>RunZW</span>
        </Link>
        <MobileMenu items={items} signedIn={Boolean(user)} />
        <div className="hidden flex-col gap-2 sm:flex sm:items-end">
          {user && (
            <p className="text-xs font-semibold text-[color:var(--muted)]">
              Signed in as {user.name ?? user.email ?? "Runner"} · {user.role ?? "RUNNER"}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[0.8rem] font-semibold text-[color:var(--muted)] sm:justify-end">
            {items.map((item) => (
              <Link
                className={`${item.variant === "primary" ? "button-primary" : "button-secondary"} min-h-9 px-3`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            {user && <SignOutButton />}
          </div>
        </div>
      </nav>
    </header>
  );
}
