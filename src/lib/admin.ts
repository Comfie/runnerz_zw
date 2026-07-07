import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function requireAdmin(): Promise<string> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/signin");
  if (role !== "ADMIN") redirect("/");
  return (session.user as { id: string }).id;
}

type AdminClub = {
  id: string;
  name: string;
  verified: boolean;
  _count: { events: number; members: number };
};

export function summarizeClubsForAdmin(clubs: AdminClub[]) {
  return clubs.map((club) => ({
    id: club.id,
    name: club.name,
    status: club.verified ? "Approved" : "Pending",
    events: club._count.events,
    members: club._count.members,
  }));
}

export function approveClub(clubId: string) {
  return db.club.update({ where: { id: clubId }, data: { verified: true } });
}

export function setEventStatusAsAdmin(
  eventId: string,
  status: "DRAFT" | "PUBLISHED",
) {
  return db.event.update({ where: { id: eventId }, data: { status } });
}
