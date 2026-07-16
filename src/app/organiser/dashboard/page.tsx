import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";
import Link from "next/link";
import { updateEventStatus } from "./actions";

export const dynamic = "force-dynamic";

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road", TRAIL: "Trail", ULTRA: "Ultra",
  RELAY: "Relay", CHARITY: "Charity", KIDS: "Kids",
};

export default async function Dashboard() {
  const { clubId } = await requireOrganiser();
  const events = await db.event.findMany({
    where: { clubId },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { registrations: true } } },
  });

  const now = new Date();

  return (
    <main className="app-container py-5 sm:py-8">
      <div className="surface rounded-[1.5rem] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-[color:var(--green-dark)]">
              Club operations
            </p>
            <h1 className="text-2xl font-black">Organiser dashboard</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <Link className="button-secondary" href="/organiser/profile">Club profile</Link>
            <Link className="button-primary" href="/organiser/events/new">+ New event</Link>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {events.map((e) => {
            const isPast = e.startsAt < now;
            const isRegistrationClosed =
              isPast || (e.registrationDeadline !== null && e.registrationDeadline < now);
            const registrationCount = e._count.registrations;

            return (
              <div key={e.id} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{e.title}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                        e.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[color:var(--line)] text-[color:var(--muted)]"
                      }`}>
                        {e.status === "PUBLISHED" ? "Live" : "Draft"}
                      </span>
                      {e.eventType && (
                        <span className="rounded-full bg-[rgba(30,142,62,0.1)] px-2 py-0.5 text-[0.65rem] font-bold text-[color:var(--green-dark)]">
                          {EVENT_TYPE_LABEL[e.eventType] ?? e.eventType}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {e.startsAt.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {e.startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {e.locationText}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-[color:var(--muted)]">
                      <span>{registrationCount} {registrationCount === 1 ? "registration" : "registrations"}</span>
                      {e.registrationDeadline && (
                        <span>
                          {isRegistrationClosed && !isPast
                            ? "Registration closed"
                            : isPast
                            ? "Event ended"
                            : `Reg. closes ${e.registrationDeadline.toLocaleDateString([], { day: "numeric", month: "short" })}`}
                        </span>
                      )}
                      {e.expectedRunners && (
                        <span>~{e.expectedRunners.toLocaleString()} expected</span>
                      )}
                      {e.hasFinisherMedal && <span>★ Medal</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Link
                      href={`/organiser/events/${e.id}/edit`}
                      className="button-secondary"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/organiser/events/${e.id}/registrations`}
                      className="button-secondary"
                    >
                      Registrations {registrationCount > 0 && `(${registrationCount})`}
                    </Link>
                    {e.status === "PUBLISHED" && (
                      <Link
                        href={`/events/${e.id}`}
                        target="_blank"
                        className="button-secondary"
                      >
                        View ↗
                      </Link>
                    )}
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
                  <button className={e.status === "PUBLISHED" ? "button-secondary" : "button-primary"}>
                    {e.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-8 text-center">
              <p className="text-sm text-[color:var(--muted)]">No events yet.</p>
              <Link href="/organiser/events/new" className="button-primary mt-4 inline-flex">
                Create your first event
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
