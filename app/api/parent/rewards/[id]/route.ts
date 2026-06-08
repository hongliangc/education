import { NextResponse } from "next/server";
import { requireRewardActor, rewardErrorResponse } from "@/lib/rewards/guard";
import { deactivateReward, updateReward } from "@/lib/rewards/management";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRewardActor("parent");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const reward = await updateReward(gate.value, id, {
      ...(body.title !== undefined ? { title: String(body.title) } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      ...(body.starsCost !== undefined ? { starsCost: Number(body.starsCost) } : {}),
      ...(body.stock !== undefined ? { stock: body.stock === null ? null : Number(body.stock) } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
    });
    if (!reward) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ reward });
  } catch (error) {
    return rewardErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRewardActor("parent");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  try {
    const reward = await deactivateReward(gate.value, id);
    if (!reward) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ reward });
  } catch (error) {
    return rewardErrorResponse(error);
  }
}
