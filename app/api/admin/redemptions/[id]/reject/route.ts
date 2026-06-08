import { NextResponse } from "next/server";
import { requireRewardActor, rewardErrorResponse } from "@/lib/rewards/guard";
import { rejectManagedRedemption } from "@/lib/rewards/management";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRewardActor("admin");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const result = await rejectManagedRedemption(gate.value, id, body.note ? String(body.note) : undefined);
    return NextResponse.json(result);
  } catch (error) {
    return rewardErrorResponse(error);
  }
}
