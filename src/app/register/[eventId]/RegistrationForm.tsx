"use client";

import { useActionState } from "react";
import { submitRegistration, type RegistrationState } from "./actions";

const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function RegistrationForm({
  eventId,
  eventTitle,
  distances,
  defaults,
}: {
  eventId: string;
  eventTitle: string;
  distances: string[];
  defaults: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<RegistrationState, FormData>(
    submitRegistration.bind(null, eventId),
    { error: null, values: defaults },
  );
  const v = state.values;

  return (
    <form key={JSON.stringify(v)} action={action} className="mt-5 space-y-5">
      <fieldset>
        <legend className="field-label">Distance</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {distances.map((d) => (
            <label
              key={d}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 font-black transition hover:border-[color:var(--green)] has-[:checked]:border-[color:var(--green)] has-[:checked]:bg-[rgba(30,142,62,0.08)]"
            >
              <input
                type="radio"
                name="distance"
                value={d}
                required
                defaultChecked={v.distance === d || distances.length === 1}
              />
              {d}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="field-label mb-2">Runner details</legend>
        <label className="sm:col-span-2">
          <span className="field-label">Full name (as it should appear in results)</span>
          <input name="fullName" required autoComplete="name" defaultValue={v.fullName} className="field" />
        </label>
        <label>
          <span className="field-label">Race category</span>
          <select name="gender" required defaultValue={v.gender} className="field">
            <option value="">Select</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>
        </label>
        <label>
          <span className="field-label">Date of birth</span>
          <input name="dateOfBirth" type="date" required autoComplete="bday" defaultValue={v.dateOfBirth} className="field" />
        </label>
        <label>
          <span className="field-label">T-shirt size (optional)</span>
          <select name="tshirtSize" defaultValue={v.tshirtSize} className="field">
            <option value="">No preference</option>
            {TSHIRT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="field-label mb-2">Emergency contact</legend>
        <label>
          <span className="field-label">Name</span>
          <input name="emergencyName" required defaultValue={v.emergencyName} className="field" />
        </label>
        <label>
          <span className="field-label">Phone</span>
          <input
            name="emergencyPhone"
            type="tel"
            required
            placeholder="+263 77 123 4567"
            defaultValue={v.emergencyPhone}
            className="field"
          />
        </label>
      </fieldset>

      <label className="flex items-start gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-6 text-[color:var(--muted)]">
        <input type="checkbox" name="waiver" required defaultChecked={v.waiver === "on"} className="mt-1" />
        <span>
          I confirm I am medically fit to take part in <strong>{eventTitle}</strong>. I enter
          at my own risk and release the organisers, sponsors and RunZW from liability for
          any injury, loss or damage, and I agree to follow race rules and marshal
          instructions.
        </span>
      </label>

      {state.error && (
        <p role="alert" className="rounded-2xl bg-[rgba(220,38,38,0.1)] p-3 text-sm font-bold text-red-700">
          {state.error}
        </p>
      )}

      <button disabled={pending} className="button-primary w-full disabled:opacity-60">
        {pending ? "Registering…" : "Confirm registration"}
      </button>
    </form>
  );
}
