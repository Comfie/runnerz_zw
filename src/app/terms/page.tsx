import { PageHeader } from "@/components/PageHeader"
import { CONTACT_EMAIL } from "@/lib/send"

export default function Terms() {
  return (
    <main className="app-container py-8 sm:py-10 lg:py-14">
      <PageHeader eyebrow="Terms of Use" title="Terms of Use" />

      <div className="mt-8 max-w-2xl space-y-6 text-base leading-7 text-[color:var(--foreground)]">
        <p className="text-sm text-[color:var(--muted)]">Last updated 2026.</p>

        <section>
          <h2 className="text-lg font-black">Acceptance of these terms</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            By using RunZW, you agree to these terms. If you don&rsquo;t
            agree, please don&rsquo;t use the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">What RunZW is</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW is a listing and discovery platform for running events in
            Zimbabwe. We are not the organiser of the events listed on the
            site — each event is run by the club or organiser that listed
            it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Event information</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            Event details — dates, routes, pricing, and logistics — are
            provided by the listing club or organiser, not verified by
            RunZW. Always confirm details directly with the organiser before
            travelling or paying, especially close to race day.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Registration &amp; payments</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW does not process payments. You pay the organiser directly,
            following that event&rsquo;s own payment instructions.
            Registering through RunZW records your interest with the
            organiser but doesn&rsquo;t by itself guarantee your place —
            confirm with the organiser if you&rsquo;re unsure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Your account</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW uses one-time codes sent to your email or phone to sign
            you in. Keep access to that email or phone secure — you&rsquo;re
            responsible for activity under your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Clubs &amp; organisers</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            If you list events on RunZW, you&rsquo;re responsible for the
            accuracy of your listings and for running the event as
            described.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Acceptable use</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            Don&rsquo;t post fraudulent event listings, spam, or otherwise
            abuse the site. We can remove listings or accounts that violate
            this.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Limitation of liability</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW is provided as-is. We aren&rsquo;t liable for event
            cancellations or changes, injuries, or disputes between runners
            and organisers — those are between you and the organiser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Changes to these terms</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            We may update these terms as RunZW grows. We&rsquo;ll update the
            date at the top of this page when we do.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Contact</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            Questions about these terms?{" "}
            <a
              className="font-semibold text-[color:var(--green-dark)]"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
