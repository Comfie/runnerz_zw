import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";
import { updateClubProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const { clubId } = await requireOrganiser();
  const club = await db.club.findUniqueOrThrow({ where: { id: clubId } });

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-md rounded-[1.5rem] p-5 sm:p-7">
      <h1 className="text-2xl font-black">Club profile</h1>
      <form action={updateClubProfile} className="mt-4 space-y-3">
        <input name="name" defaultValue={club.name} required className="field" />
        <input
          name="contact"
          defaultValue={club.contact}
          required
          className="field"
        />
        <input
          name="logoUrl"
          defaultValue={club.logoUrl ?? ""}
          placeholder="Logo URL"
          className="field"
        />
        <button className="button-primary">
          Save
        </button>
      </form>
      </section>
    </main>
  );
}
