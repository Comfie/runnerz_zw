type HeaderUser = { role?: string } | null;
type HeaderClub = { verified: boolean } | null;

export type HeaderNavItem = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export function getHeaderNavigation(
  user: HeaderUser,
  club: HeaderClub,
): HeaderNavItem[] {
  const items: HeaderNavItem[] = [
    { href: "/me", label: "My runs", variant: "secondary" },
  ];

  if (user?.role === "ORGANISER") {
    items.push({
      href: club?.verified ? "/organiser/dashboard" : "/organiser/pending",
      label: club?.verified ? "Dashboard" : "Pending",
      variant: "secondary",
    });
  } else {
    items.push({
      href: "/organiser/apply",
      label: "Organiser",
      variant: "secondary",
    });
  }

  if (user?.role === "ADMIN") {
    items.push({ href: "/admin", label: "Admin", variant: "secondary" });
  }

  if (!user) {
    items.push({ href: "/signin", label: "Sign in", variant: "primary" });
  }

  return items;
}
