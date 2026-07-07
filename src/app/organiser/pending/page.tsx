export default function Pending() {
  return (
    <main className="app-container grid min-h-[calc(100vh-5rem)] place-items-center py-6">
      <section className="surface w-full max-w-md rounded-[1.5rem] p-5 sm:p-7">
      <h1 className="text-2xl font-black">Awaiting approval</h1>
      <p className="mt-2 text-sm text-[color:var(--muted)]">
        Your club is awaiting approval.
      </p>
      </section>
    </main>
  );
}
