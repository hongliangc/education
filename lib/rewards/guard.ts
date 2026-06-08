import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveManagementAccess, type ManagementArea } from "@/lib/auth/management";
import { resolveRewardActor, type RewardActor } from "@/lib/rewards/authorization";
import { InsufficientStarsError, RewardDomainError } from "@/lib/rewards/errors";

// Domain error code -> HTTP status. Unmapped domain errors fall back to 400.
const ERROR_STATUS: Record<string, number> = {
  reward_access_denied: 403,
  insufficient_stars: 402,
  previous_chapter_required: 409,
  out_of_stock: 409,
  resource_unavailable: 404,
  redemption_not_found: 404,
  invalid_redemption_state: 409,
  invalid_reward_input: 400,
};

export type GuardResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: NextResponse };

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Any authenticated user (child-facing reward routes operate on the parent's children).
export async function requireUserId(): Promise<GuardResult<string>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, response: unauthorized() };
  return { ok: true, value: session.user.id };
}

// A management actor allowed in the given area (parent: PARENT|ADMIN, admin: ADMIN).
export async function requireRewardActor(
  area: ManagementArea,
): Promise<GuardResult<RewardActor>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, response: unauthorized() };
  if (!resolveManagementAccess(session.user, area).allowed) {
    return { ok: false, response: forbidden() };
  }
  const actor = resolveRewardActor(session.user);
  if (!actor) return { ok: false, response: forbidden() };
  return { ok: true, value: actor };
}

export function rewardErrorResponse(error: unknown): NextResponse {
  if (error instanceof RewardDomainError) {
    const status = ERROR_STATUS[error.code] ?? 400;
    const body: Record<string, unknown> = { error: error.code };
    if (error instanceof InsufficientStarsError) body.needed = error.needed;
    return NextResponse.json(body, { status });
  }
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
