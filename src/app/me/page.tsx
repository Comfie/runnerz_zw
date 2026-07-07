import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Me() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const regs = await db.registration.findMany({
    where: { userId: (session.user as { id: string }).id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-5 sm:p-7">
        <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
          Runner dashboard
        </p>
        <h1 className="text-2xl font-black">My registrations</h1>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {regs.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
            <p className="font-black">{r.event.title}</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {r.distance} · {r.status}
            </p>
          </li>
        ))}
      </ul>
      {regs.length === 0 && (
        <p className="mt-5 rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-5 text-sm text-[color:var(--muted)]">
          You haven&apos;t registered for anything yet.
        </p>
      )}
      </section>
    </main>
  );
}
