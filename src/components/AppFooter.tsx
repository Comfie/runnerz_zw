import Link from "next/link"
import { BRAND } from "@/lib/brand"
import { CONTACT_EMAIL } from "@/lib/send"
import { BrandLogo } from "./BrandLogo"

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
]

export function AppFooter() {
  return (
    <footer className="bg-[color:var(--maroon)] text-[color:var(--cream)]/80">
      <div className="app-container grid gap-8 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo tone="light" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">
            {BRAND.tagline}. Discover races, register in seconds, and never miss a start line.
          </p>
          <Link href="/organiser/apply" className="button-flag mt-4 min-h-10 px-5 text-sm">
            List your race
          </Link>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">
            Company
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link className="hover:text-white" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">
            Legal
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link className="hover:text-white" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="app-container flex flex-col gap-1 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <a className="font-semibold hover:text-white" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <p className="text-xs text-white/60">
            &copy; {new Date().getFullYear()} {BRAND.name}
          </p>
        </div>
      </div>
    </footer>
  )
}
