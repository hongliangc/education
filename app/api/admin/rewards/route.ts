import { NextResponse } from "next/server";
import { requireRewardActor } from "@/lib/rewards/guard";
import { createReward, listRewards } from "@/lib/rewards/management";

const PLATFORM = { ownerType: "PLATFORM" as const, ownerId: null };

export async function GET() {
  const gate = await requireRewardActor("admin");
  if (!gate.ok) return gate.response;
  return NextResponse.json({ rewards: await listRewards(PLATFORM) });
}

export async function POST(req: Request) {
  const gate = await requireRewardActor("admin");
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }

  const reward = await createReward(PLATFORM, {
    title,
    description: body.description ?? null,
    imageUrl: body.imageUrl ?? null,
    starsCost: Number(body.starsCost),
    stock: body.stock === null || body.stock === undefined ? null : Number(body.stock),
  });
  return NextResponse.json({ reward });
}
