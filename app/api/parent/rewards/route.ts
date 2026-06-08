import { NextResponse } from "next/server";
import { requireRewardActor } from "@/lib/rewards/guard";
import { createReward, listRewards } from "@/lib/rewards/management";

export async function GET() {
  const gate = await requireRewardActor("parent");
  if (!gate.ok) return gate.response;
  const owner = { ownerType: "FAMILY" as const, ownerId: gate.value.id };
  return NextResponse.json({ rewards: await listRewards(owner) });
}

export async function POST(req: Request) {
  const gate = await requireRewardActor("parent");
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }

  const owner = { ownerType: "FAMILY" as const, ownerId: gate.value.id };
  const reward = await createReward(owner, {
    title,
    description: body.description ?? null,
    imageUrl: body.imageUrl ?? null,
    starsCost: Number(body.starsCost),
    stock: body.stock === null || body.stock === undefined ? null : Number(body.stock),
  });
  return NextResponse.json({ reward });
}
