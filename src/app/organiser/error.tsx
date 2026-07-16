"use client"

export default function OrganiserError({ reset }: { reset: () => void }) {
  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-2xl rounded-[1.5rem] p-5 sm:p-7 text-center">
        <h1 className="text-2xl font-black">Something went wrong</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          We could not save your changes. Check your inputs — dates, map link
          or coordinates, and image files (JPEG, PNG or WebP, max 5 MB each) —
          then try again.
        </p>
        <button onClick={() => reset()} className="button-primary mt-5">
          Try again
        </button>
      </section>
    </main>
  )
}
