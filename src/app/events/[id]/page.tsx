import { getEvent } from "@/lib/events";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEvent(id);
  if (!e || e.status !== "PUBLISHED") notFound();
  const startsAt = new Date(e.startsAt);

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface overflow-hidden rounded-[1.75rem]">
        <div className="h-3 bg-[linear-gradient(90deg,var(--teal),var(--mango),var(--coral))]" />
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_18rem] lg:p-9">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-[rgba(8,127,123,0.1)] px-3 py-1 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
              {e.locationText}
            </p>
            <h1 className="section-title max-w-3xl font-black">{e.title}</h1>
            <p className="mt-4 max-w-[56ch] whitespace-pre-wrap text-base leading-7 text-[color:var(--muted)]">
              {e.description}
            </p>
          </div>
          <aside className="rounded-[1.25rem] bg-[color:var(--foreground)] p-4 text-white">
            <div className="rounded-2xl bg-white/10 p-4">
              <span className="text-xs font-bold uppercase text-white/60">
                Starts
              </span>
              <p className="mt-1 text-2xl font-black">
                {startsAt.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-white/75">
                {startsAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {e.distanceOptions.map((distance) => (
                <span
                  key={distance}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold"
                >
                  {distance}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="surface rounded-[1.5rem] p-5 sm:p-6">
          <h2 className="text-lg font-black">Payment note</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
            {e.paymentInfo}
          </p>
        </div>
        <div className="surface rounded-[1.5rem] p-5 sm:p-6">
          <Link href={`/register/${e.id}`} className="button-primary w-full">
            Register
          </Link>
          <p className="mt-4 rounded-xl bg-[rgba(242,184,75,0.18)] p-3 text-xs font-semibold text-[color:var(--foreground)]">
            Share this event: /events/{e.id}
          </p>
        </div>
      </section>
    </main>
  );
}
