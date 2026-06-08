import { NextResponse } from "next/server";
import { requireRewardActor, rewardErrorResponse } from "@/lib/rewards/guard";
import { fulfillManagedRedemption } from "@/lib/rewards/management";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRewardActor("admin");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await fulfillManagedRedemption(gate.value, id, body.note ? String(body.note) : undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return rewardErrorResponse(error);
  }
}
