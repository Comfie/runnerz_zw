import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { approveClubAction, setAdminEventStatus } from "../../actions";
import { fmtShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road", TRAIL: "Trail", ULTRA: "Ultra",
  RELAY: "Relay", CHARITY: "Charity", KIDS: "Kids",
};

export default async function AdminClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const club = await db.club.findUnique({
    where: { id },
    include: {
      owner: true,
      members: { orderBy: { createdAt: "desc" } },
      events: {
        orderBy: { startsAt: "asc" },
        include: { _count: { select: { registrations: true } } },
      },
      _count: { select: { events: true, members: true } },
    },
  });
  if (!club) notFound();

  const totalRegistrations = club.events.reduce(
    (sum, e) => sum + e._count.registrations,
    0,
  );

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-4 sm:p-7">
        <Link className="button-secondary mb-5 inline-flex" href="/admin">
          ← Back to admin
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-[color:var(--green-dark)]">
              Club details
            </p>
            <h1 className="text-2xl font-black sm:text-3xl">{club.name}</h1>
            <p className="mt-1 break-words text-sm text-[color:var(--muted)]">{club.contact}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
              club.verified
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[rgba(242,183,5,0.24)] text-[color:var(--foreground)]"
            }`}>
              {club.verified ? "Approved" : "Pending approval"}
            </span>
            {!club.verified && (
              <form action={approveClubAction.bind(null, club.id)}>
                <button className="button-primary">Approve club</button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-[rgba(30,142,62,0.1)] p-4">
            <p className="text-2xl font-black">{club._count.events}</p>
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">Events</p>
          </div>
          <div className="rounded-2xl bg-[rgba(242,183,5,0.18)] p-4">
            <p className="text-2xl font-black">{club._count.members}</p>
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">Members</p>
          </div>
          <div className="rounded-2xl bg-[rgba(210,38,47,0.1)] p-4">
            <p className="text-2xl font-black">{totalRegistrations}</p>
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">Registrations</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">Owner</p>
            <p className="mt-1 break-words text-sm font-black">
              {club.owner?.name ?? "—"}
            </p>
            {club.owner?.email && (
              <p className="truncate text-xs text-[color:var(--muted)]">{club.owner.email}</p>
            )}
          </div>
        </div>

        <section className="mt-6">
          <h2 className="font-black">Events</h2>
          <div className="mt-3 grid gap-3">
            {club.events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{event.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                      event.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[color:var(--line)] text-[color:var(--muted)]"
                    }`}>
                      {event.status === "PUBLISHED" ? "Live" : "Draft"}
                    </span>
                    {event.eventType && (
                      <span className="rounded-full bg-[rgba(30,142,62,0.1)] px-2 py-0.5 text-[0.65rem] font-bold text-[color:var(--green-dark)]">
                        {EVENT_TYPE_LABEL[event.eventType] ?? event.eventType}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {fmtShortDate(event.startsAt)}
                    {" · "}{event._count.registrations} registrations
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {event.status === "PUBLISHED" && (
                    <Link href={`/events/${event.id}`} target="_blank" className="button-secondary text-sm">
                      View ↗
                    </Link>
                  )}
                  <form
                    action={setAdminEventStatus.bind(
                      null,
                      event.id,
                      event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                    )}
                  >
                    <button className={event.status === "PUBLISHED" ? "button-secondary" : "button-primary"}>
                      {event.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {club.events.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-4 text-sm text-[color:var(--muted)]">
                This club has no events yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-black">Members</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {club.members.map((member) => (
              <div
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                key={member.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black">{member.name ?? "—"}</p>
                  <span className="rounded-full bg-[color:var(--line)] px-2 py-0.5 text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">
                    {member.role}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm text-[color:var(--muted)]">
                  {member.email ?? member.phone ?? "No contact"}
                </p>
                <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                  Joined {fmtShortDate(member.createdAt)}
                </p>
              </div>
            ))}
            {club.members.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-4 text-sm text-[color:var(--muted)]">
                No members yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
