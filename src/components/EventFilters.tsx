export function EventFilters({ distances }: { distances: string[] }) {
  return (
    <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.8fr_auto]" method="get">
      <label>
        <span className="field-label">Location</span>
        <input name="location" placeholder="Harare, Bulawayo..." className="field" />
      </label>
      <label>
        <span className="field-label">From</span>
        <input type="date" name="from" className="field" />
      </label>
      <label>
        <span className="field-label">Distance</span>
        <select name="distance" className="field">
          <option value="">Any distance</option>
          {distances.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <button className="button-primary mt-1 w-full self-end sm:col-span-2 lg:col-span-1">
        Filter events
      </button>
    </form>
  );
}
