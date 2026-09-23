import { toRegistrationRow } from "@/lib/csv";
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
    include: { registrations: { include: { user: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!event || event.clubId !== clubId) notFound();

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black">Registrations: {event.title} ({event.registrations.length})</h1>
        <Link
          className="button-secondary"
          href={`/organiser/events/${event.id}/registrations/export`}
        >
          Export CSV
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[color:var(--line)] bg-white/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-[rgba(30,142,62,0.08)]">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Distance</th>
              <th className="p-2">Category</th>
              <th className="p-2">DOB</th>
              <th className="p-2">Emergency contact</th>
              <th className="p-2">T-shirt</th>
              <th className="p-2">Waiver</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {event.registrations.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-[color:var(--muted)]">
                  No registrations yet.
                </td>
              </tr>
            )}
            {event.registrations.map((r) => {
              const row = toRegistrationRow(r);
              return (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-2 font-bold">{row.name}</td>
                  <td className="p-2">{row.contact}</td>
                  <td className="p-2">{row.distance}</td>
                  <td className="p-2">{row.category}</td>
                  <td className="p-2 whitespace-nowrap">{row.dateOfBirth}</td>
                  <td className="p-2">
                    {row.emergencyName}
                    {row.emergencyPhone && (
                      <span className="block text-xs text-[color:var(--muted)]">{row.emergencyPhone}</span>
                    )}
                  </td>
                  <td className="p-2">{row.tshirtSize}</td>
                  <td className="p-2">{row.waiverAccepted}</td>
                  <td className="p-2">{row.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </section>
    </main>
  );
}
