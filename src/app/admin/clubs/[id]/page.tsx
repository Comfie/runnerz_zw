import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { approveClubAction, setAdminEventStatus } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const club = await db.club.findUnique({
    where: { id },
    include: {
      owner: true,
      members: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { startsAt: "asc" } },
      _count: { select: { events: true, members: true } },
    },
  });
  if (!club) notFound();

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-4 sm:p-7">
        <Link className="button-secondary mb-5" href="/admin">
          Back to admin
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
              Club details
            </p>
            <h1 className="text-2xl font-black sm:text-3xl">{club.name}</h1>
            <p className="mt-2 break-words text-sm text-[color:var(--muted)]">
              {club.contact}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${club.verified ? "bg-[rgba(8,127,123,0.12)] text-[color:var(--teal-dark)]" : "bg-[rgba(242,184,75,0.24)] text-[color:var(--foreground)]"}`}>
              {club.verified ? "Approved" : "Pending"}
            </span>
            {!club.verified && (
              <form action={approveClubAction.bind(null, club.id)}>
                <button className="button-primary w-full sm:w-auto">Approve club</button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[rgba(8,127,123,0.1)] p-4">
            <p className="text-2xl font-black">{club._count.events}</p>
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
              Events
            </p>
          </div>
          <div className="rounded-2xl bg-[rgba(242,184,75,0.18)] p-4">
            <p className="text-2xl font-black">{club._count.members}</p>
            <p className="text-xs font-bold uppercase text-[color:var(--muted)]">
              Members
            </p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4 sm:col-span-1 col-span-2">
            <p className="text-sm font-black">Owner</p>
            <p className="mt-1 break-words text-sm text-[color:var(--muted)]">
              {club.owner?.name ?? "No owner assigned"}
            </p>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="font-black">Events</h2>
          <div className="mt-3 grid gap-3">
            {club.events.map((event) => (
              <form
                action={setAdminEventStatus.bind(
                  null,
                  event.id,
                  event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                )}
                className="flex flex-col gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
                key={event.id}
              >
                <span className="min-w-0 break-words text-sm sm:text-base">
                  <strong>{event.title}</strong>
                  <span className="mt-1 block text-[color:var(--muted)] md:mt-0 md:inline">
                    {" "}· {new Date(event.startsAt).toLocaleDateString()} · {event.status}
                  </span>
                </span>
                <button className="button-secondary w-full md:w-auto">
                  {event.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
              </form>
            ))}
            {club.events.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-4 text-sm text-[color:var(--muted)]">
                This club has no events yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-black">Members</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {club.members.map((member) => (
              <div
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                key={member.id}
              >
                <p className="font-black">{member.name}</p>
                <p className="mt-1 break-words text-sm text-[color:var(--muted)]">
                  {member.email ?? member.phone ?? "No contact"} · {member.role}
                </p>
              </div>
            ))}
            {club.members.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 p-4 text-sm text-[color:var(--muted)]">
                This club has no members yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
