import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventRegistrations({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clubId } = await requireOrganiser();
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { registrations: { include: { user: true } } },
  });
  if (!event || event.clubId !== clubId) notFound();

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black">Registrations: {event.title}</h1>
        <Link
          className="button-secondary"
          href={`/organiser/events/${event.id}/registrations/export`}
        >
          Export CSV
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[color:var(--line)] bg-white/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-[rgba(8,127,123,0.08)]">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Distance</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {event.registrations.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.user.name}</td>
                <td className="p-2">{r.user.email ?? r.user.phone}</td>
                <td className="p-2">{r.distance}</td>
                <td className="p-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </section>
    </main>
  );
}
