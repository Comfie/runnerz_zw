export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro?: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 inline-flex rounded-full bg-[color:var(--gold)] px-3 py-1 text-xs font-bold uppercase text-[color:var(--foreground)]">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
      {intro && (
        <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
          {intro}
        </p>
      )}
    </div>
  )
}
