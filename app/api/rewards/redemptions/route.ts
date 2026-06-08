import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/rewards/guard";

export async function GET(req: Request) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.response;

  const childId = new URL(req.url).searchParams.get("childId") ?? "";
  if (!childId) {
    return NextResponse.json({ error: "child_required" }, { status: 400 });
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: gate.value },
    select: { id: true },
  });
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const redemptions = await prisma.rewardRedemption.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    include: {
      resource: {
        select: { resourceType: true, resourceKey: true, title: true, imageUrl: true },
      },
    },
  });
  return NextResponse.json({ redemptions });
}
