import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OpenListApiError, OpenListConfigError } from "@/lib/openlist/client";
import { prisma } from "@/lib/db";
import { getVideoCatalog, OpenListCatalogError } from "@/lib/video/catalog";
import { InsufficientStarsError } from "@/lib/rewards/errors";
import { upsertVideoResource } from "@/lib/rewards/management";
import { redeemResource } from "@/lib/rewards/service";

function unlockErrorResponse(error: unknown) {
  if (error instanceof OpenListConfigError || error instanceof OpenListCatalogError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof OpenListApiError) {
    const status = error.status === 404 ? 404 : error.status === 503 ? 503 : 502;
    return NextResponse.json({ error: "video_service_unavailable" }, { status });
  }
  return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const childId = String(body.childId ?? "");
    if (!childId) {
      return NextResponse.json({ error: "child_required" }, { status: 400 });
    }

    const videos = await getVideoCatalog();
    const video = videos.find((item) => item.id === id);
    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: session.user.id },
      select: { id: true, totalStars: true },
    });
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (video.cost === 0) {
      return NextResponse.json({ unlocked: true, balance: child.totalStars });
    }

    // Sync the platform VIDEO resource to the catalog's current cost, then redeem
    // through the unified service (idempotent: a repeat unlock never double-charges).
    const resourceId = await upsertVideoResource(id, video.title, video.cost);
    try {
      const result = await redeemResource({ childId, resourceId, ownerId: session.user.id });
      return NextResponse.json({ unlocked: true, balance: result.balance });
    } catch (error) {
      if (error instanceof InsufficientStarsError) {
        return NextResponse.json(
          { error: "insufficient_stars", needed: error.needed },
          { status: 402 },
        );
      }
      throw error;
    }
  } catch (error) {
    return unlockErrorResponse(error);
  }
}
