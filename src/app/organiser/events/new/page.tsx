import { createEvent } from "./actions";

export default function NewEvent() {
  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-2xl rounded-[1.5rem] p-5 sm:p-7">
      <h1 className="text-2xl font-black">New event</h1>
      <EventForm action={createEvent} />
      </section>
    </main>
  );
}

function EventForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="mt-4 space-y-3">
      <input name="title" placeholder="Title" required className="field" />
      <textarea
        name="description"
        placeholder="Description"
        required
        className="field min-h-28"
      />
      <input
        name="startsAt"
        type="datetime-local"
        required
        className="field"
      />
      <input
        name="locationText"
        placeholder="Location"
        required
        className="field"
      />
      <input
        name="distanceOptions"
        placeholder="Distances, e.g. 5k, 10k"
        required
        className="field"
      />
      <input
        name="coverImageUrl"
        placeholder="Cover image URL"
        className="field"
      />
      <textarea
        name="paymentInfo"
        placeholder="How runners should pay or complete registration"
        required
        className="field min-h-24"
      />
      <button className="button-primary">
        Save
      </button>
    </form>
  );
}
