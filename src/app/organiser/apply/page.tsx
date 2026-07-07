import { submitApplication } from "./actions";

export default function Apply() {
  return (
    <main className="app-container grid min-h-[calc(100vh-5rem)] place-items-center py-6">
      <section className="surface w-full max-w-md rounded-[1.5rem] p-5 sm:p-7">
      <p className="mb-2 text-xs font-bold uppercase text-[color:var(--teal-dark)]">
        Club tools
      </p>
      <h1 className="text-2xl font-black">Apply as organiser</h1>
      <form action={submitApplication} className="mt-4 space-y-3">
        <input
          name="clubName"
          placeholder="Club name"
          required
          className="field"
        />
        <input
          name="contact"
          placeholder="Contact email or phone"
          required
          className="field"
        />
        <button className="button-primary w-full">
          Submit
        </button>
      </form>
      </section>
    </main>
  );
}
