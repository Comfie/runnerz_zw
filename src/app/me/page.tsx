import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCountdownLabel } from "@/lib/countdown";

export const dynamic = "force-dynamic";

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road", TRAIL: "Trail", ULTRA: "Ultra",
  RELAY: "Relay", CHARITY: "Charity", KIDS: "Kids",
};

export default async function Me() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const userId = (session.user as { id: string }).id;

  const [user, regs] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.registration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { event: { startsAt: "asc" } },
    }),
  ]);

  const now = new Date();
  const upcoming = regs.filter((r) => r.event.startsAt >= now && r.event.status === "PUBLISHED");
  const past = regs.filter((r) => r.event.startsAt < now).reverse();
  const totalDistances = regs.map((r) => r.distance);

  return (
    <main className="app-container py-5 sm:py-8 lg:py-10">
      {/* Header */}
      <section className="surface rounded-[1.5rem] p-5 sm:p-7">
        <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">Runner dashboard</p>
        <h1 className="text-2xl font-black sm:text-3xl">{user?.name ?? "My races"}</h1>
        {(user?.email ?? user?.phone) && (
          <p className="mt-1 text-sm text-[color:var(--muted)]">{user?.email ?? user?.phone}</p>
        )}

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[rgba(8,127,123,0.1)] p-4 text-center">
            <p className="text-2xl font-black">{regs.length}</p>
            <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">Races entered</p>
          </div>
          <div className="rounded-2xl bg-[rgba(242,184,75,0.18)] p-4 text-center">
            <p className="text-2xl font-black">{upcoming.length}</p>
            <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">Upcoming</p>
          </div>
          <div className="rounded-2xl bg-[rgba(230,86,63,0.1)] p-4 text-center">
            <p className="text-2xl font-black">{past.length}</p>
            <p className="text-[0.65rem] font-bold uppercase text-[color:var(--muted)]">Completed</p>
          </div>
        </div>
      </section>

      {/* Upcoming races */}
      <section className="mt-5">
        <h2 className="mb-3 text-lg font-black">Upcoming races</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-8 text-center">
            <p className="text-sm text-[color:var(--muted)]">No upcoming races.</p>
            <Link href="/#races" className="button-primary mt-4 inline-flex">Browse events</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((r) => {
              const countdown = getCountdownLabel(r.event.startsAt);
              return (
                <Link
                  key={r.id}
                  href={`/events/${r.event.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(24,32,29,0.1)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--teal),var(--mango),var(--coral))]" />
                  <div className="mt-1 flex items-start justify-between gap-3">
                    {/* Date block */}
                    <div className="rounded-2xl bg-[color:var(--foreground)] px-3 py-2 text-center text-white">
                      <span className="block text-[0.6rem] font-bold uppercase leading-none text-white/65">
                        {r.event.startsAt.toLocaleString("en", { weekday: "short" })}
                      </span>
                      <span className="block text-xs font-bold uppercase text-white/65">
                        {r.event.startsAt.toLocaleString("en", { month: "short" })}
                      </span>
                      <span className="block text-2xl font-black leading-none">
                        {r.event.startsAt.getDate()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {countdown && (
                        <span className="rounded-full bg-[rgba(242,184,75,0.18)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
                          {countdown}
                        </span>
                      )}
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        r.status === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[rgba(8,127,123,0.1)] text-[color:var(--teal-dark)]"
                      }`}>
                        {r.status === "PAID" ? "✓ Paid" : "Registered"}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-4 font-black leading-tight">{r.event.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{r.event.locationText}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-bold">
                      {r.distance}
                    </span>
                    {r.event.eventType && (
                      <span className="rounded-full bg-[rgba(8,127,123,0.08)] px-3 py-1 text-xs font-bold text-[color:var(--teal-dark)]">
                        {EVENT_TYPE_LABEL[r.event.eventType] ?? r.event.eventType}
                      </span>
                    )}
                    {r.event.hasFinisherMedal && (
                      <span className="text-xs text-[color:var(--muted)]">★ Medal</span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-[color:var(--muted)]">
                    {r.event.startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm font-bold text-[color:var(--teal-dark)]">
                    View event
                    <span className="ml-1 transition group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Past races */}
      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-black">Past races</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {past.map((r) => (
              <Link
                key={r.id}
                href={`/events/${r.event.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-white/70 p-4 transition hover:border-[color:var(--teal)]"
              >
                <div className="min-w-0">
                  <p className="truncate font-black">{r.event.title}</p>
                  <p className="mt-0.5 text-sm text-[color:var(--muted)]">
                    {r.event.startsAt.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{r.distance}
                    {r.event.eventType ? ` · ${EVENT_TYPE_LABEL[r.event.eventType] ?? r.event.eventType}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    r.status === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[color:var(--line)] text-[color:var(--muted)]"
                  }`}>
                    {r.status === "PAID" ? "✓ Paid" : "Registered"}
                  </span>
                  {r.event.hasFinisherMedal && (
                    <span className="text-xs text-[color:var(--muted)]">★ Medal</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
