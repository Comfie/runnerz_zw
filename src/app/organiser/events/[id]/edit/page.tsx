import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";
import { notFound } from "next/navigation";
import { updateEvent } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditEvent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clubId } = await requireOrganiser();
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } });
  if (!event || event.clubId !== clubId) notFound();

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-2xl rounded-[1.5rem] p-5 sm:p-7">
      <h1 className="text-2xl font-black">Edit event</h1>
      <form action={updateEvent.bind(null, id)} className="mt-4 space-y-3">
        <input name="title" defaultValue={event.title} required className="field" />
        <textarea
          name="description"
          defaultValue={event.description}
          required
          className="field min-h-28"
        />
        <input
          name="startsAt"
          type="datetime-local"
          defaultValue={event.startsAt.toISOString().slice(0, 16)}
          required
          className="field"
        />
        <input
          name="locationText"
          defaultValue={event.locationText}
          required
          className="field"
        />
        <input
          name="distanceOptions"
          defaultValue={event.distanceOptions.join(", ")}
          required
          className="field"
        />
        <input
          name="coverImageUrl"
          defaultValue={event.coverImageUrl ?? ""}
          className="field"
        />
        <textarea
          name="paymentInfo"
          defaultValue={event.paymentInfo}
          required
          className="field min-h-24"
        />
        <button className="button-primary">
          Save
        </button>
      </form>
      </section>
    </main>
  );
}
