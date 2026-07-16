import { PageHeader } from "@/components/PageHeader"
import { CONTACT_EMAIL } from "@/lib/send"

export default function Privacy() {
  return (
    <main className="app-container py-8 sm:py-10 lg:py-14">
      <PageHeader eyebrow="Privacy Policy" title="Privacy Policy" />

      <div className="mt-8 max-w-2xl space-y-6 text-base leading-7 text-[color:var(--foreground)]">
        <p className="text-sm text-[color:var(--muted)]">Last updated 2026.</p>

        <section>
          <h2 className="text-lg font-black">Overview</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW is an independent race-calendar service for Zimbabwe. This
            page explains what information we collect when you use it and
            why.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-[color:var(--muted)]">
            <li>
              The email or phone number you sign in with. RunZW uses one-time
              codes for sign-in and never asks for or stores a password.
            </li>
            <li>Which event and distance you register for.</li>
            <li>
              If you apply to list events as a club or organiser: the club
              name and contact details you provide.
            </li>
            <li>
              If you use the contact form: your name, email, and message.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black">How we use it</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-[color:var(--muted)]">
            <li>To send you a one-time sign-in code by email or SMS.</li>
            <li>
              To confirm your event registrations and communicate with you
              about events you&rsquo;ve registered for.
            </li>
            <li>To review and approve club/organiser applications.</li>
            <li>To respond to messages sent via the contact form.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black">Third-party services</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            Delivering the above requires a few third-party providers:{" "}
            <strong>Resend</strong> to send email, <strong>Twilio</strong> to
            send SMS codes, and <strong>Railway</strong> to host our
            database and application. These providers process your data only
            to deliver these services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Cookies</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW sets a session cookie to keep you signed in after you
            verify a one-time code. We don&rsquo;t use advertising or
            tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Payments</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            RunZW does not process or store payment information. Each event
            lists its own payment details, and you pay the organiser
            directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Your data, your choice</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            You can ask us to delete your data at any time by emailing{" "}
            <a
              className="font-semibold text-[color:var(--green-dark)]"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black">Changes to this policy</h2>
          <p className="mt-2 text-[color:var(--muted)]">
            As RunZW grows, this policy may be updated to reflect new
            features or providers. We&rsquo;ll update the date at the top of
            this page when we do.
          </p>
        </section>
      </div>
    </main>
  )
}
