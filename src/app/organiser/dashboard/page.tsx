import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";
import Link from "next/link";
import { updateEventStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { clubId } = await requireOrganiser();
  const events = await db.event.findMany({
    where: { clubId },
    orderBy: { startsAt: "asc" },
  });

  return (
    <main className="app-container py-5 sm:py-8">
      <div className="surface rounded-[1.5rem] p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
            Club operations
          </p>
          <h1 className="text-2xl font-black">Organiser dashboard</h1>
        </div>
        <div className="flex gap-3 text-sm">
          <Link className="button-secondary" href="/organiser/profile">Club profile</Link>
          <Link className="button-primary" href="/organiser/events/new">New event</Link>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((e) => (
          <div key={e.id} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black">{e.title}</h2>
                <p className="text-sm text-[color:var(--muted)]">
                  {new Date(e.startsAt).toLocaleString()} · {e.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={`/organiser/events/${e.id}/edit`}>Edit</Link>
                <Link href={`/organiser/events/${e.id}/registrations`}>
                  Registrations
                </Link>
              </div>
            </div>
            <form
              action={updateEventStatus.bind(
                null,
                e.id,
                e.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
              )}
              className="mt-3"
            >
              <button className="button-secondary">
                {e.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </button>
            </form>
          </div>
        ))}
        {events.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-4 text-sm text-[color:var(--muted)]">
            No events yet.
          </p>
        )}
      </div>
      </div>
    </main>
  );
}
