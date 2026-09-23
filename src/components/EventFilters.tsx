export function EventFilters({
  distances,
  values = {},
}: {
  distances: string[]
  values?: { location?: string; distance?: string; from?: string; eventType?: string }
}) {
  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
      method="get"
      action="/#races"
    >
      {values.eventType && <input type="hidden" name="eventType" value={values.eventType} />}
      <label>
        <span className="field-label">Location</span>
        <input
          name="location"
          placeholder="Harare, Bulawayo..."
          defaultValue={values.location}
          className="field"
        />
      </label>
      <label>
        <span className="field-label">From</span>
        <input type="date" name="from" defaultValue={values.from} className="field" />
      </label>
      <label>
        <span className="field-label">Distance</span>
        <select name="distance" defaultValue={values.distance ?? ""} className="field">
          <option value="">Any distance</option>
          {distances.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <button className="button-primary w-full self-end">Apply filters</button>
    </form>
  )
}
