import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getEvent } from "@/lib/events"
import { getCountdownLabel } from "@/lib/countdown"
import { fmtDate, fmtTime } from "@/lib/format"
import { getRaceDayWeather } from "@/lib/weather"
import { ShareButtons } from "@/components/ShareButtons"

export const dynamic = "force-dynamic"

const EVENT_TYPE_LABEL: Record<string, string> = {
  ROAD: "Road",
  TRAIL: "Trail",
  ULTRA: "Ultra",
  RELAY: "Relay",
  CHARITY: "Charity",
  KIDS: "Kids",
}

type Props = { params: Promise<{ id: string }> }

function isUsableImage(url: string | null): url is string {
  return Boolean(url && /^https?:\/\/|^\//.test(url))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const e = await getEvent(id)
  if (!e || e.status !== "PUBLISHED") return {}

  const summary = [
    fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "long", year: "numeric" }),
    e.locationText,
    e.distanceOptions.join(" / "),
  ].join(" · ")
  const images = isUsableImage(e.coverImageUrl) ? [e.coverImageUrl] : ["/og-default.jpg"]

  return {
    title: e.title,
    description: summary,
    alternates: { canonical: `/events/${e.id}` },
    openGraph: {
      type: "website",
      title: e.title,
      description: summary,
      url: `/events/${e.id}`,
      images,
    },
    twitter: { card: "summary_large_image", title: e.title, description: summary, images },
  }
}

export default async function EventPage({ params }: Props) {
  const { id } = await params
  const e = await getEvent(id)
  if (!e || e.status !== "PUBLISHED") notFound()

  const host = (await headers()).get("host") ?? ""
  const proto = host.startsWith("localhost") ? "http" : "https"
  const eventUrl = `${proto}://${host}/events/${e.id}`

  const now = new Date()
  const isPast = e.startsAt < now
  const isRegistrationClosed =
    isPast || (e.registrationDeadline !== null && e.registrationDeadline < now)
  const countdown = getCountdownLabel(e.startsAt)
  const weather =
    e.lat !== null && e.lng !== null && !isPast
      ? await getRaceDayWeather(e.lat, e.lng, e.startsAt)
      : null

  const summary = (
    <RaceSummary
      startsAt={e.startsAt}
      distances={e.distanceOptions}
      registrationDeadline={e.registrationDeadline}
      isRegistrationClosed={isRegistrationClosed}
      expectedRunners={e.expectedRunners}
      hasFinisherMedal={e.hasFinisherMedal}
    />
  )

  return (
    <main className="app-container pt-5 sm:pt-8 pb-24 lg:py-8">
      <section className="relative min-h-[45vh] overflow-hidden rounded-[1.75rem]">
        {isUsableImage(e.coverImageUrl) ? (
          <Image
            src={e.coverImageUrl}
            alt={e.title}
            fill
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--green)_0%,var(--green-dark)_40%,var(--foreground)_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70" />
        <div className="absolute bottom-0 left-0 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[rgba(30,142,62,0.85)] px-3 py-1 text-xs font-bold text-white">
              {e.locationText}
            </span>
            {e.eventType && (
              <span className="inline-flex rounded-full bg-[rgba(30,142,62,0.85)] px-3 py-1 text-xs font-bold text-white">
                {EVENT_TYPE_LABEL[e.eventType] ?? e.eventType}
              </span>
            )}
            {!isPast && countdown && (
              <span className="inline-flex rounded-full bg-[rgba(242,183,5,0.9)] px-3 py-1 text-xs font-bold text-[color:var(--foreground)]">
                {countdown}
              </span>
            )}
          </div>
          <h1 className="section-title max-w-3xl font-black text-white">
            {e.title}
          </h1>
          <p className="mt-2 text-sm text-white/70">by {e.club.name}</p>
        </div>
      </section>

      <div className="mt-5 gap-5 lg:grid lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div className="surface rounded-[1.5rem] p-5 lg:hidden">
            <p className="mb-3 text-xs font-bold uppercase text-[color:var(--green-dark)]">
              Race at a glance
            </p>
            {summary}
            <ShareButtons url={eventUrl} title={e.title} />
          </div>

          <div className="surface rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-lg font-black">About this race</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--muted)]">
              {e.description}
            </p>
          </div>

          <div className="surface rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-lg font-black">How to register &amp; pay</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
              {e.paymentInfo}
            </p>
          </div>

          {e.logistics && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Race day info</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
                {e.logistics}
              </p>
            </div>
          )}

          {weather && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Race-day weather</h2>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--muted)]">
                <span className="font-bold text-[color:var(--foreground)]">
                  {weather.label}
                </span>
                <span>
                  {weather.maxTempC}° / {weather.minTempC}°C
                </span>
                <span>Humidity {weather.humidityPct}%</span>
                <span>Wind {weather.windKmh} km/h</span>
              </div>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Forecast via Open-Meteo
              </p>
            </div>
          )}

          {e.photos.length > 0 && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Photos</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {e.photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square overflow-hidden rounded-xl"
                  >
                    <Image
                      src={p.url}
                      alt={p.caption ?? e.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {e.lat !== null && e.lng !== null && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Location</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {e.locationText}
              </p>
              <div className="mt-3 overflow-hidden rounded-xl">
                <iframe
                  src={`https://maps.google.com/maps?q=${e.lat},${e.lng}&z=14&output=embed`}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  title="Event location map"
                />
              </div>
              <a
                href={`https://maps.google.com/?q=${e.lat},${e.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-sm font-bold text-[color:var(--green-dark)]"
              >
                View on Google Maps →
              </a>
            </div>
          )}

          <div className="surface rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-lg font-black">Organised by</h2>
            <div className="mt-3 flex items-center gap-3">
              {isUsableImage(e.club.logoUrl) && (
                <Image
                  src={e.club.logoUrl}
                  width={48}
                  height={48}
                  alt={e.club.name}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <Link
                  href={`/clubs/${e.clubId}`}
                  className="font-bold text-[color:var(--green-dark)] hover:underline"
                >
                  {e.club.name}
                </Link>
                <p className="text-sm text-[color:var(--muted)]">
                  {e.club.contact}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="mt-4 hidden lg:block">
          <div className="surface sticky top-24 rounded-[1.5rem] p-5">
            {summary}
            <RegisterAction eventId={e.id} isRegistrationClosed={isRegistrationClosed} />
            <ShareButtons url={eventUrl} title={e.title} />
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[color:var(--line)] bg-[rgba(251,252,248,0.92)] px-4 py-3 backdrop-blur lg:hidden">
        <RegisterAction eventId={e.id} isRegistrationClosed={isRegistrationClosed} compact />
      </div>
    </main>
  )
}

function RaceSummary({
  startsAt,
  distances,
  registrationDeadline,
  isRegistrationClosed,
  expectedRunners,
  hasFinisherMedal,
}: {
  startsAt: Date
  distances: string[]
  registrationDeadline: Date | null
  isRegistrationClosed: boolean
  expectedRunners: number | null
  hasFinisherMedal: boolean
}) {
  const deadlineCountdown = registrationDeadline
    ? getCountdownLabel(registrationDeadline)
    : null

  return (
    <div>
      <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
        {fmtDate(startsAt, { weekday: "long" })}
      </p>
      <p className="mt-1 text-2xl font-black">
        {fmtDate(startsAt, { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <p className="text-sm text-[color:var(--muted)]">Start {fmtTime(startsAt)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {distances.map((d) => (
          <span
            key={d}
            className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-bold"
          >
            {d}
          </span>
        ))}
      </div>

      {registrationDeadline && (
        <div className="mt-4 text-xs text-[color:var(--muted)]">
          {isRegistrationClosed ? (
            <p className="font-bold">Registration closed</p>
          ) : (
            <>
              <p>
                Registration closes{" "}
                {fmtDate(registrationDeadline, { day: "numeric", month: "short", year: "numeric" })}
              </p>
              {deadlineCountdown && (
                <span className="mt-1 inline-flex rounded-full bg-[rgba(220,38,38,0.12)] px-2 py-0.5 text-xs font-bold text-red-700">
                  Closes {deadlineCountdown.toLowerCase()}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {expectedRunners !== null && (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          ~{expectedRunners.toLocaleString()} runners expected
        </p>
      )}
      {hasFinisherMedal && (
        <p className="mt-1 text-xs text-[color:var(--muted)]">★ Finisher medal awarded</p>
      )}
    </div>
  )
}

function RegisterAction({
  eventId,
  isRegistrationClosed,
  compact = false,
}: {
  eventId: string
  isRegistrationClosed: boolean
  compact?: boolean
}) {
  if (isRegistrationClosed) {
    return (
      <p className={`${compact ? "" : "mt-5 "}text-center text-sm text-[color:var(--muted)]`}>
        Registration closed
      </p>
    )
  }
  return (
    <Link
      href={`/register/${eventId}`}
      className={`button-primary ${compact ? "" : "mt-5 "}block w-full text-center`}
    >
      Register
    </Link>
  )
}
