import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/organisers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/organiser/events/[id]/registrations/export">) {
  const { clubId } = await requireOrganiser();
  const { id } = await ctx.params;
  const event = await db.event.findUnique({
    where: { id },
    include: { registrations: { include: { user: true } } },
  });
  if (!event || event.clubId !== clubId) return new Response("Not found", { status: 404 });

  const csv = toCsv(
    event.registrations.map((r) => ({
      name: r.user.name,
      contact: r.user.email ?? r.user.phone ?? "",
      distance: r.distance,
      status: r.status,
      registeredAt: r.createdAt.toISOString().slice(0, 10),
    })),
  );
  const safeName = event.title.replace(/[^\w-]+/g, "_");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}-registrations.csv"`,
    },
  });
}
