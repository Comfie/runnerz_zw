type HeaderUser = { role?: string } | null;
type HeaderClub = { verified: boolean } | null;

export type HeaderNavItem = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export const PUBLIC_NAV = [
  { href: "/#races", label: "Races" },
  { href: "/organiser/apply", label: "List your race" },
  { href: "/about", label: "About" },
];

export function getHeaderNavigation(
  user: HeaderUser,
  club: HeaderClub,
): HeaderNavItem[] {
  if (!user) {
    return [{ href: "/signin", label: "Sign in", variant: "primary" }];
  }

  const items: HeaderNavItem[] = [
    { href: "/me", label: "My runs", variant: "secondary" },
  ];

  if (user.role === "ORGANISER") {
    items.push({
      href: club?.verified ? "/organiser/dashboard" : "/organiser/pending",
      label: club?.verified ? "Dashboard" : "Pending",
      variant: "secondary",
    });
  }

  if (user.role === "ADMIN") {
    items.push({ href: "/admin", label: "Admin", variant: "secondary" });
  }

  return items;
}
