export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#166b2f" />
      <path
        d="M9 10.5h13.5L9.5 22h13.5"
        fill="none"
        stroke="#f2b705"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10.5" r="2.6" fill="#d2262f" />
    </svg>
  )
}

export function BrandLogo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const text = tone === "light" ? "text-white" : "text-[color:var(--foreground)]"
  const accent = tone === "light" ? "text-[color:var(--gold)]" : "text-[color:var(--green)]"
  return (
    <span className="flex items-center gap-2">
      <BrandMark />
      <span className={`text-lg font-black tracking-tight ${text}`}>
        Run<span className={accent}>ZW</span>
      </span>
    </span>
  )
}
