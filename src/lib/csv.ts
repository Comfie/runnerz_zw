type Row = {
  name: string;
  contact: string;
  distance: string;
  status: string;
  registeredAt: string;
};

function esc(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: Row[]): string {
  const header = "Name,Contact,Distance,Status,Registered At";
  const lines = rows.map((r) =>
    [r.name, r.contact, r.distance, r.status, r.registeredAt]
      .map(esc)
      .join(","),
  );
  return [header, ...lines].join("\n");
}
