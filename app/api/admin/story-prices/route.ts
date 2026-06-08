import { NextResponse } from "next/server";
import { requireRewardActor } from "@/lib/rewards/guard";
import { listStoryPrices, upsertStoryPrice } from "@/lib/rewards/management";

const PLATFORM = { ownerType: "PLATFORM" as const, ownerId: null };

export async function GET() {
  const gate = await requireRewardActor("admin");
  if (!gate.ok) return gate.response;
  return NextResponse.json({ prices: await listStoryPrices(PLATFORM) });
}

export async function PUT(req: Request) {
  const gate = await requireRewardActor("admin");
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const resourceType = String(body.resourceType ?? "");
  const resourceKey = String(body.resourceKey ?? "");
  if ((resourceType !== "STORY_CHAPTER" && resourceType !== "STORY_TALE") || !resourceKey) {
    return NextResponse.json({ error: "invalid_reward_input" }, { status: 400 });
  }

  const resource = await upsertStoryPrice(PLATFORM, {
    resourceType,
    resourceKey,
    starsCost: Number(body.starsCost),
  });
  return NextResponse.json({ resource });
}
