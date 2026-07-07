import { summarizeClubsForAdmin, requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  approveClubAction,
  createClub,
  seedEvent,
  setAdminEventStatus,
} from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Admin() {
  await requireAdmin();
  const [pendingClubs, clubs, events] = await Promise.all([
    db.club.findMany({ where: { verified: false }, orderBy: { createdAt: "asc" } }),
    db.club.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true, members: true } } },
    }),
    db.event.findMany({ include: { club: true }, orderBy: { startsAt: "asc" } }),
  ]);
  const clubSummaries = summarizeClubsForAdmin(clubs);

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-4 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
              Platform control
            </p>
            <h1 className="text-2xl font-black sm:text-3xl">Admin</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-[rgba(8,127,123,0.1)] p-3">
              <p className="text-xl font-black">{pendingClubs.length}</p>
              <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">
                Pending
              </p>
            </div>
            <div className="rounded-2xl bg-[rgba(242,184,75,0.18)] p-3">
              <p className="text-xl font-black">{clubSummaries.length}</p>
              <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">
                Clubs
              </p>
            </div>
            <div className="rounded-2xl bg-[rgba(230,86,63,0.12)] p-3">
              <p className="text-xl font-black">{events.length}</p>
              <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">
                Events
              </p>
            </div>
          </div>
        </div>

      <section className="mt-6">
        <h2 className="font-black">Pending clubs</h2>
        <div className="mt-3 grid gap-3">
          {pendingClubs.map((club) => (
            <form
              key={club.id}
              action={approveClubAction.bind(null, club.id)}
              className="flex flex-col gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 break-words text-sm sm:text-base">
                <strong>{club.name}</strong>
                <span className="block text-[color:var(--muted)] sm:inline">
                  {" "}· {club.contact}
                </span>
              </span>
              <button className="button-secondary w-full sm:w-auto">Approve</button>
            </form>
          ))}
          {pendingClubs.length === 0 && (
            <p className="text-sm text-[color:var(--muted)]">No pending clubs.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-black">All clubs</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {clubSummaries.map((club) => (
            <Link
              className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 transition hover:border-[color:var(--teal)] hover:shadow-[var(--shadow-card)]"
              href={`/admin/clubs/${club.id}`}
              key={club.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="break-words font-black">{club.name}</h3>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {club.events} events · {club.members} members
                  </p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${club.status === "Approved" ? "bg-[rgba(8,127,123,0.12)] text-[color:var(--teal-dark)]" : "bg-[rgba(242,184,75,0.24)] text-[color:var(--foreground)]"}`}>
                  {club.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
          <h2 className="font-black">Create club</h2>
          <form action={createClub} className="mt-3 grid gap-3">
            <input name="name" placeholder="Name" required className="field" />
            <input
              name="contact"
              placeholder="Contact"
              required
              className="field"
            />
            <button className="button-primary w-full">
              Create
            </button>
          </form>
        </div>
        <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
          <h2 className="font-black">Seed event</h2>
          <form action={seedEvent} className="mt-3 grid gap-3 sm:grid-cols-2">
            <select name="clubId" required className="field">
              <option value="">Choose club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            <input name="title" placeholder="Title" required className="field" />
            <input
              name="startsAt"
              type="datetime-local"
              required
              className="field"
            />
            <input
              name="locationText"
              placeholder="Location"
              required
              className="field"
            />
            <input
              name="distanceOptions"
              placeholder="Distances"
              required
              className="field"
            />
            <textarea
              name="description"
              placeholder="Description"
              required
              className="field min-h-24 sm:col-span-2"
            />
            <textarea
              name="paymentInfo"
              placeholder="Payment note"
              required
              className="field min-h-24 sm:col-span-2"
            />
            <button className="button-primary w-full sm:col-span-2">
              Seed
            </button>
          </form>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-black">Events</h2>
        <div className="mt-3 grid gap-3">
          {events.map((event) => (
            <form
              key={event.id}
              action={setAdminEventStatus.bind(
                null,
                event.id,
                event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
              )}
              className="flex flex-col gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
            >
              <span className="min-w-0 break-words text-sm sm:text-base">
                <strong>{event.title}</strong>
                <span className="mt-1 block text-[color:var(--muted)] md:mt-0 md:inline">
                  {" "}· {event.club.name} · {event.status}
                </span>
              </span>
              <button className="button-secondary w-full md:w-auto">
                {event.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </button>
            </form>
          ))}
        </div>
      </section>
      </section>
    </main>
  );
}
