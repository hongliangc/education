import { NextResponse } from "next/server";
import { requireUserId, rewardErrorResponse } from "@/lib/rewards/guard";
import { redeemResource } from "@/lib/rewards/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.response;

  const { resourceId } = await params;
  const body = await req.json().catch(() => ({}));
  const childId = String(body.childId ?? "");
  if (!childId || !resourceId) {
    return NextResponse.json({ error: "invalid_reward_input" }, { status: 400 });
  }

  try {
    const result = await redeemResource({ childId, resourceId, ownerId: gate.value });
    return NextResponse.json(result);
  } catch (error) {
    return rewardErrorResponse(error);
  }
}
