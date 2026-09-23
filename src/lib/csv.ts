import { localDayKey } from "@/lib/format";

export type Row = {
  name: string;
  contact: string;
  distance: string;
  category: string;
  dateOfBirth: string;
  emergencyName: string;
  emergencyPhone: string;
  tshirtSize: string;
  waiverAccepted: string;
  status: string;
  registeredAt: string;
};

const COLUMNS: [keyof Row, string][] = [
  ["name", "Name"],
  ["contact", "Contact"],
  ["distance", "Distance"],
  ["category", "Category"],
  ["dateOfBirth", "Date of Birth"],
  ["emergencyName", "Emergency Contact"],
  ["emergencyPhone", "Emergency Phone"],
  ["tshirtSize", "T-shirt"],
  ["waiverAccepted", "Waiver Accepted"],
  ["status", "Status"],
  ["registeredAt", "Registered At"],
];

function esc(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: Row[]): string {
  const header = COLUMNS.map(([, label]) => label).join(",");
  const lines = rows.map((r) => COLUMNS.map(([key]) => esc(r[key])).join(","));
  return [header, ...lines].join("\n");
}

type RegistrationWithUser = {
  distance: string;
  status: string;
  createdAt: Date;
  fullName: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  tshirtSize: string | null;
  waiverAcceptedAt: Date | null;
  user: { name: string; email: string | null; phone: string | null };
};

const CATEGORY: Record<string, string> = { FEMALE: "Female", MALE: "Male" };

export function toRegistrationRow(r: RegistrationWithUser): Row {
  return {
    name: r.fullName ?? r.user.name,
    contact: r.user.email ?? r.user.phone ?? "",
    distance: r.distance,
    category: r.gender ? (CATEGORY[r.gender] ?? r.gender) : "",
    dateOfBirth: r.dateOfBirth ? localDayKey(r.dateOfBirth) : "",
    emergencyName: r.emergencyName ?? "",
    emergencyPhone: r.emergencyPhone ?? "",
    tshirtSize: r.tshirtSize ?? "",
    waiverAccepted: r.waiverAcceptedAt ? "Yes" : "No",
    status: r.status,
    registeredAt: localDayKey(r.createdAt),
  };
}
