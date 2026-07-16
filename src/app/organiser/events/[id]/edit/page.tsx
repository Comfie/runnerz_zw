import { db } from "@/lib/db"
import { requireOrganiser } from "@/lib/organisers"
import { notFound } from "next/navigation"
import Image from "next/image"
import { listEventPhotos, MAX_PHOTOS_PER_EVENT } from "@/lib/photos"
import { removePhoto, saveCaption, updateEvent, uploadPhotos } from "./actions"

export const dynamic = "force-dynamic"

export default async function EditEvent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { clubId } = await requireOrganiser()
  const { id } = await params
  const event = await db.event.findUnique({ where: { id } })
  if (!event || event.clubId !== clubId) notFound()
  const photos = await listEventPhotos(id)

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-2xl rounded-[1.5rem] p-5 sm:p-7">
        <h1 className="text-2xl font-black">Edit event</h1>
        <form action={updateEvent.bind(null, id)} className="mt-4 space-y-3">
          <input
            name="title"
            defaultValue={event.title}
            required
            className="field"
          />
          <select name="eventType" defaultValue={event.eventType ?? ""} required className="field">
            <option value="">Select type</option>
            <option value="ROAD">Road</option>
            <option value="TRAIL">Trail</option>
            <option value="ULTRA">Ultra</option>
            <option value="RELAY">Relay</option>
            <option value="CHARITY">Charity</option>
            <option value="KIDS">Kids</option>
          </select>
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
            name="registrationDeadline"
            type="datetime-local"
            defaultValue={event.registrationDeadline?.toISOString().slice(0, 16) ?? ""}
            className="field"
          />
          <input
            name="locationText"
            defaultValue={event.locationText}
            required
            className="field"
          />
          <input
            name="locationPin"
            placeholder="Google Maps link or coordinates, e.g. -17.82, 31.05 (optional)"
            defaultValue={
              event.lat !== null && event.lng !== null
                ? `${event.lat}, ${event.lng}`
                : ""
            }
            className="field"
          />
          <input
            name="distanceOptions"
            defaultValue={event.distanceOptions.join(", ")}
            required
            className="field"
          />
          <input
            name="expectedRunners"
            type="number"
            min="1"
            defaultValue={event.expectedRunners ?? ""}
            placeholder="Expected runners (optional)"
            className="field"
          />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              name="hasFinisherMedal"
              defaultChecked={event.hasFinisherMedal}
            />
            Finisher medal awarded
          </label>
          <label className="block text-sm font-bold">
            Cover photo
            <input
              type="file"
              name="coverImage"
              accept="image/jpeg,image/png,image/webp"
              className="field mt-1"
            />
          </label>
          <input
            name="coverImageUrl"
            defaultValue={event.coverImageUrl ?? ""}
            placeholder="…or paste a cover image URL"
            className="field"
          />
          <textarea
            name="paymentInfo"
            defaultValue={event.paymentInfo}
            required
            className="field min-h-24"
          />
          <textarea
            name="logistics"
            defaultValue={event.logistics ?? ""}
            placeholder="Parking, bag storage, water points, cut-off times, medical support... (optional)"
            className="field min-h-24"
          />
          <button className="button-primary">Save</button>
        </form>
      </section>

      <section className="surface mx-auto mt-5 max-w-2xl rounded-[1.5rem] p-5 sm:p-7">
        <h2 className="text-lg font-black">Photos</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Up to {MAX_PHOTOS_PER_EVENT} photos shown on the public event page.
        </p>
        {photos.length < MAX_PHOTOS_PER_EVENT && (
          <form
            action={uploadPhotos.bind(null, id)}
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            <input
              type="file"
              name="photos"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
              className="field flex-1"
            />
            <button className="button-primary">Upload</button>
          </form>
        )}
        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <li key={p.id} className="space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={p.url}
                    alt={p.caption ?? "Event photo"}
                    fill
                    className="object-cover"
                  />
                </div>
                <form
                  action={saveCaption.bind(null, id, p.id)}
                  className="flex gap-2"
                >
                  <input
                    name="caption"
                    defaultValue={p.caption ?? ""}
                    placeholder="Caption"
                    className="field text-xs"
                  />
                  <button className="button-secondary text-xs">Save</button>
                </form>
                <form action={removePhoto.bind(null, id, p.id)}>
                  <button className="button-secondary w-full text-xs">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
