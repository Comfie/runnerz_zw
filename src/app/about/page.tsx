import { PageHeader } from "@/components/PageHeader"

export default function About() {
  return (
    <main className="app-container py-8 sm:py-10 lg:py-14">
      <PageHeader
        eyebrow="About"
        title="Zimbabwe's race calendar, built for runners."
        intro="RunZW is a single place to find running events across Zimbabwe — road races, trail runs, ultras, relays, and charity runs — listed by the clubs and organisers who put them on."
      />

      <div className="mt-8 max-w-2xl space-y-6 text-base leading-7 text-[color:var(--foreground)]">
        <section>
          <h2 className="text-lg font-black">What we do</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            We bring Zimbabwe&rsquo;s running calendar into one place, so you
            don&rsquo;t have to piece it together from flyers and group
            chats. Browse events by location, distance, and type, and see
            what&rsquo;s coming up next.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">How registration works</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            Sign in with a one-time code sent to your email or phone — no
            password to remember. Register for a race in seconds. RunZW
            doesn&rsquo;t process payments; each event lists its own payment
            details, and you pay the organiser directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Who it&rsquo;s for</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            Runners looking for their next race, and clubs and organisers who
            want a straightforward way to list an event and see who&rsquo;s
            coming.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Where we&rsquo;re at</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW is an independent, early-stage project. We&rsquo;re
            building it in the open, race by race — if there&rsquo;s
            something you&rsquo;d like to see, <a className="font-semibold text-[color:var(--green-dark)]" href="/contact">let us know</a>.
          </p>
        </section>
      </div>
    </main>
  )
}
