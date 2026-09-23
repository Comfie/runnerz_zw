import { summarizeClubsForAdmin, requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  approveClubAction,
  createClub,
  seedEvent,
  setAdminEventStatus,
} from "./actions";
import Link from "next/link";
import { fmtShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road", TRAIL: "Trail", ULTRA: "Ultra",
  RELAY: "Relay", CHARITY: "Charity", KIDS: "Kids",
};

export default async function Admin() {
  await requireAdmin();
  const [pendingClubs, clubs, events, registrationCount] = await Promise.all([
    db.club.findMany({ where: { verified: false }, orderBy: { createdAt: "asc" } }),
    db.club.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true, members: true } } },
    }),
    db.event.findMany({
      include: { club: true, _count: { select: { registrations: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.registration.count(),
  ]);
  const clubSummaries = summarizeClubsForAdmin(clubs);
  const publishedCount = events.filter((e) => e.status === "PUBLISHED").length;

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-4 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-[color:var(--green-dark)]">
              Platform control
            </p>
            <h1 className="text-2xl font-black sm:text-3xl">Admin</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <div className="rounded-2xl bg-[rgba(220,38,38,0.08)] p-3">
              <p className="text-xl font-black">{pendingClubs.length}</p>
              <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">Pending</p>
            </div>
            <div className="rounded-2xl bg-[rgba(242,183,5,0.18)] p-3">
              <p className="text-xl font-black">{clubSummaries.length}</p>
              <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">Clubs</p>
            </div>
            <div className="rounded-2xl bg-[rgba(30,142,62,0.1)] p-3">
              <p className="text-xl font-black">{publishedCount}<span className="text-sm font-normal text-[color:var(--muted)]">/{events.length}</span></p>
              <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">Events live</p>
            </div>
            <div className="rounded-2xl bg-[rgba(210,38,47,0.1)] p-3">
              <p className="text-xl font-black">{registrationCount}</p>
              <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">Registrations</p>
            </div>
          </div>
        </div>

        {/* Pending clubs */}
        <section className="mt-6">
          <h2 className="font-black">
            Pending clubs
            {pendingClubs.length > 0 && (
              <span className="ml-2 rounded-full bg-[rgba(220,38,38,0.12)] px-2 py-0.5 text-xs font-bold text-red-700">
                {pendingClubs.length}
              </span>
            )}
          </h2>
          <div className="mt-3 grid gap-3">
            {pendingClubs.map((club) => (
              <div
                key={club.id}
                className="flex flex-col gap-3 rounded-2xl border border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.04)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-words font-black">{club.name}</p>
                  <p className="text-sm text-[color:var(--muted)]">{club.contact}</p>
                  <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                    Applied {fmtShortDate(club.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/clubs/${club.id}`} className="button-secondary text-sm">
                    View
                  </Link>
                  <form action={approveClubAction.bind(null, club.id)}>
                    <button className="button-primary">Approve</button>
                  </form>
                </div>
              </div>
            ))}
            {pendingClubs.length === 0 && (
              <p className="text-sm text-[color:var(--muted)]">No pending clubs.</p>
            )}
          </div>
        </section>

        {/* All clubs */}
        <section className="mt-6">
          <h2 className="font-black">All clubs</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {clubSummaries.map((club) => (
              <Link
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 transition hover:border-[color:var(--green)] hover:shadow-[var(--shadow-card)]"
                href={`/admin/clubs/${club.id}`}
                key={club.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-black">{club.name}</h3>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {club.events} events · {club.members} members
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    club.status === "Approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[rgba(242,183,5,0.24)] text-[color:var(--foreground)]"
                  }`}>
                    {club.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section className="mt-6 grid items-start gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <details className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
            <summary className="cursor-pointer select-none font-black">
              Create club
            </summary>
            <form action={createClub} className="mt-3 grid gap-3">
              <input name="name" placeholder="Name" required className="field" />
              <input name="contact" placeholder="Contact" required className="field" />
              <button className="button-primary w-full">Create</button>
            </form>
          </details>
          <details className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
            <summary className="cursor-pointer select-none font-black">
              Seed event
            </summary>
            <form action={seedEvent} className="mt-3 grid gap-3 sm:grid-cols-2">
              <select name="clubId" required className="field">
                <option value="">Choose club</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
              <input name="title" placeholder="Title" required className="field" />
              <input name="startsAt" type="datetime-local" required className="field" />
              <input name="locationText" placeholder="Location" required className="field" />
              <input name="distanceOptions" placeholder="Distances" required className="field" />
              <textarea name="description" placeholder="Description" required className="field min-h-24 sm:col-span-2" />
              <textarea name="paymentInfo" placeholder="Payment note" required className="field min-h-24 sm:col-span-2" />
              <button className="button-primary w-full sm:col-span-2">Seed</button>
            </form>
          </details>
        </section>

        {/* All events */}
        <section className="mt-6">
          <h2 className="font-black">All events</h2>
          <div className="mt-3 grid gap-3">
            {events.map((event) => (
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
                    {event.club.name} · {fmtShortDate(event.startsAt)}
                    {" · "}{event._count.registrations} reg.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
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
            {events.length === 0 && (
              <p className="text-sm text-[color:var(--muted)]">No events yet.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
