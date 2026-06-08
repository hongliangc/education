import { NextResponse } from "next/server";
import { getChildRewardCatalog } from "@/lib/rewards/catalog";
import { requireUserId } from "@/lib/rewards/guard";

export async function GET(req: Request) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.response;

  const childId = new URL(req.url).searchParams.get("childId") ?? "";
  if (!childId) {
    return NextResponse.json({ error: "child_required" }, { status: 400 });
  }

  const catalog = await getChildRewardCatalog(childId, gate.value);
  if (!catalog) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  return NextResponse.json(catalog);
}
