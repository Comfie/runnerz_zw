import { auth } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { fmtDate, fmtTime, localDayKey } from "@/lib/format";
import { getLastRegistrationDetails } from "@/lib/registrations";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrationForm } from "./RegistrationForm";

export const dynamic = "force-dynamic";

export default async function Register({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const e = await getEvent(eventId);
  if (!e || e.status !== "PUBLISHED") notFound();

  const now = new Date();
  const isRegistrationClosed =
    e.startsAt < now || (e.registrationDeadline !== null && e.registrationDeadline < now);

  if (isRegistrationClosed) {
    return (
      <Shell>
        <h1 className="text-2xl font-black">Registration closed</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Registration for {e.title} is no longer open.
        </p>
        <Link href={`/events/${e.id}`} className="button-primary mt-5 inline-flex">
          Back to event
        </Link>
      </Shell>
    );
  }

  const header = (
    <>
      <p className="mb-2 text-xs font-bold uppercase text-[color:var(--green-dark)]">
        {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "long" })} ·{" "}
        {fmtTime(e.startsAt)} · {e.locationText}
      </p>
      <h1 className="text-2xl font-black leading-tight sm:text-3xl">Register for {e.title}</h1>
    </>
  );

  const session = await auth();
  const user = session?.user as { id: string; name?: string | null } | undefined;

  if (!user) {
    return (
      <Shell>
        {header}
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Sign in with a one-time code to register — no password needed.
        </p>
        <Link
          href={`/signin?redirectTo=/register/${e.id}`}
          className="button-primary mt-5 block w-full text-center"
        >
          Sign in to register
        </Link>
      </Shell>
    );
  }

  const last = await getLastRegistrationDetails(user.id);
  const defaults = {
    distance: "",
    fullName: last?.fullName ?? user.name ?? "",
    gender: last?.gender ?? "",
    dateOfBirth: last?.dateOfBirth ? localDayKey(last.dateOfBirth) : "",
    emergencyName: last?.emergencyName ?? "",
    emergencyPhone: last?.emergencyPhone ?? "",
    tshirtSize: last?.tshirtSize ?? "",
    waiver: "",
  };

  return (
    <Shell>
      {header}
      <RegistrationForm
        eventId={e.id}
        eventTitle={e.title}
        distances={e.distanceOptions}
        defaults={defaults}
      />
      <p className="mt-4 rounded-2xl bg-[rgba(242,183,5,0.18)] p-4 text-sm leading-6 text-[color:var(--muted)]">
        <span className="font-bold text-[color:var(--foreground)]">Payment: </span>
        {e.paymentInfo}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface mx-auto max-w-xl rounded-[1.5rem] p-5 sm:p-7">{children}</section>
    </main>
  );
}
