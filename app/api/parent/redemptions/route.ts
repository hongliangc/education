import { NextResponse } from "next/server";
import { requireRewardActor } from "@/lib/rewards/guard";
import { listManagedRedemptions } from "@/lib/rewards/management";

export async function GET(req: Request) {
  const gate = await requireRewardActor("parent");
  if (!gate.ok) return gate.response;

  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const redemptions = await listManagedRedemptions(gate.value, status);
  return NextResponse.json({ redemptions });
}
