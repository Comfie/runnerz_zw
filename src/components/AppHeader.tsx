import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderNavigation, PUBLIC_NAV } from "@/lib/header";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { SignOutButton } from "./SignOutButton";
import { MobileMenu } from "./MobileMenu";

export async function AppHeader() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  const club = user?.id
    ? await db.club.findUnique({
        where: { ownerId: user.id },
        select: { verified: true },
      })
    : null;
  const items = getHeaderNavigation(user ?? null, club);

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-white/90 backdrop-blur">
      <nav className="app-container flex min-h-16 items-center justify-between gap-4 py-3 text-sm">
        <Link href="/" aria-label="RunZW home">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 font-bold text-[color:var(--muted)] transition hover:bg-[rgba(30,142,62,0.08)] hover:text-[color:var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.variant === "primary" ? "button-primary" : "button-secondary"} min-h-9 px-4`}
            >
              {item.label}
            </Link>
          ))}
          {user && <SignOutButton />}
        </div>

        <MobileMenu items={items} links={PUBLIC_NAV} signedIn={Boolean(user)} />
      </nav>
    </header>
  );
}
