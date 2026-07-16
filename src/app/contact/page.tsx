import { PageHeader } from "@/components/PageHeader"
import { CONTACT_EMAIL } from "@/lib/send"
import { submitContact } from "./actions"

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const sp = await searchParams
  const sent = sp.sent === "true"
  const error = sp.error === "true"

  return (
    <main className="app-container py-8 sm:py-10 lg:py-14">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        intro="Question about an event, a club application, or something not working right? Send a message below."
      />

      <div className="surface mt-8 max-w-xl rounded-[1.5rem] p-5 sm:p-7">
        {sent ? (
          <p className="text-sm font-semibold text-[color:var(--green-dark)]">
            Thanks — your message has been sent. We&rsquo;ll get back to you soon.
          </p>
        ) : (
          <form action={submitContact} className="space-y-3">
            {error && (
              <p className="rounded-2xl bg-[rgba(210,38,47,0.08)] p-3 text-sm font-semibold text-[color:var(--red)]">
                Please fill in every field with a valid email address.
              </p>
            )}
            <input name="name" placeholder="Your name" required className="field" />
            <input
              name="email"
              type="email"
              placeholder="Your email"
              required
              className="field"
            />
            <textarea
              name="message"
              placeholder="Your message"
              required
              rows={5}
              className="field"
            />
            <button className="button-primary w-full">Send message</button>
          </form>
        )}
      </div>

      <p className="mt-6 text-sm text-[color:var(--muted)]">
        Prefer email? Reach us directly at{" "}
        <a
          className="font-semibold text-[color:var(--green-dark)]"
          href={`mailto:${CONTACT_EMAIL}`}
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </main>
  )
}
