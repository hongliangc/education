import { NextResponse } from "next/server";
import { requireRewardActor } from "@/lib/rewards/guard";
import { listStoryPrices, upsertStoryPrice } from "@/lib/rewards/management";

export async function GET() {
  const gate = await requireRewardActor("parent");
  if (!gate.ok) return gate.response;
  const owner = { ownerType: "FAMILY" as const, ownerId: gate.value.id };
  return NextResponse.json({ prices: await listStoryPrices(owner) });
}

export async function PUT(req: Request) {
  const gate = await requireRewardActor("parent");
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const resourceType = String(body.resourceType ?? "");
  const resourceKey = String(body.resourceKey ?? "");
  if ((resourceType !== "STORY_CHAPTER" && resourceType !== "STORY_TALE") || !resourceKey) {
    return NextResponse.json({ error: "invalid_reward_input" }, { status: 400 });
  }

  const owner = { ownerType: "FAMILY" as const, ownerId: gate.value.id };
  const resource = await upsertStoryPrice(owner, {
    resourceType,
    resourceKey,
    starsCost: Number(body.starsCost),
  });
  return NextResponse.json({ resource });
}
