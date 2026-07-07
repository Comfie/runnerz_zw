import { getEvent } from "@/lib/events"
import Link from "next/link"
import { notFound } from "next/navigation"
import { submitRegistration } from "./actions"

export const dynamic = "force-dynamic"

export default async function Register({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const e = await getEvent(eventId)
  if (!e || e.status !== "PUBLISHED") notFound()

  const now = new Date()
  const isPast = e.startsAt < now
  const isRegistrationClosed =
    isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)

  if (isRegistrationClosed) {
    return (
      <main className="app-container py-5 sm:py-8">
        <section className="surface mx-auto max-w-xl rounded-[1.5rem] p-5 sm:p-7">
          <h1 className="text-2xl font-black">Registration closed</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Registration for {e.title} is no longer open.
          </p>
          <Link
            href={`/events/${e.id}`}
            className="button-primary mt-5 inline-flex"
          >
            Back to event
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-xl rounded-[1.5rem] p-5 sm:p-7">
        <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
          Choose your distance
        </p>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Register for {e.title}
        </h1>
        <form
          action={submitRegistration.bind(null, eventId)}
          className="mt-5 grid gap-3 sm:grid-cols-2"
        >
          {e.distanceOptions.map((d) => (
            <label
              key={d}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 font-black transition hover:border-[color:var(--teal)]"
            >
              <input type="radio" name="distance" value={d} required /> {d}
            </label>
          ))}
          <button className="button-primary w-full sm:col-span-2">
            Confirm registration
          </button>
        </form>
        <p className="mt-4 rounded-2xl bg-[rgba(242,184,75,0.18)] p-4 text-sm leading-6 text-[color:var(--muted)]">
          Payment: {e.paymentInfo}
        </p>
      </section>
    </main>
  )
}
