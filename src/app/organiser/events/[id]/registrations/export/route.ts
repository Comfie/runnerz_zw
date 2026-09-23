import { toCsv, toRegistrationRow } from "@/lib/csv";
import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/organiser/events/[id]/registrations/export">) {
  const { clubId } = await requireOrganiser();
  const { id } = await ctx.params;
  const event = await db.event.findUnique({
    where: { id },
    include: { registrations: { include: { user: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!event || event.clubId !== clubId) return new Response("Not found", { status: 404 });

  const csv = toCsv(event.registrations.map(toRegistrationRow));
  const safeName = event.title.replace(/[^\w-]+/g, "_");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}-registrations.csv"`,
    },
  });
}
