import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  OpenListApiError,
  OpenListConfigError,
} from "@/lib/openlist/client";
import { prisma } from "@/lib/db";
import { getVideoSource, OpenListCatalogError } from "@/lib/video/catalog";
import { getOpenListVideoPlayInfo } from "@/lib/video/play";
import { isVideoUnlocked } from "@/lib/rewards/management";

function playErrorResponse(error: unknown) {
  if (error instanceof OpenListConfigError || error instanceof OpenListCatalogError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof OpenListApiError) {
    if (error.status === 202) {
      return NextResponse.json(
        { error: "video_preparing", retryAfterSec: 5 },
        { status: 202, headers: { "Retry-After": "5" } },
      );
    }
    if (error.status === 422) {
      return NextResponse.json({ error: "video_transcode_failed" }, { status: 422 });
    }
    if (error.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const status = error.status === 503 ? 503 : 502;
    return NextResponse.json({ error: "video_service_unavailable" }, { status });
  }
  return NextResponse.json({ error: "video_service_unavailable" }, { status: 502 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId") ?? "";
    if (!childId) {
      return NextResponse.json({ error: "child_required" }, { status: 400 });
    }

    const { id } = await params;
    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: session.user.id },
      select: { id: true },
    });
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const video = await getVideoSource(id);
    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (video.cost > 0 && !(await isVideoUnlocked(childId, id))) {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    const forceRefresh = url.searchParams.get("refresh") === "1";
    const play = await getOpenListVideoPlayInfo(video.sourcePath, forceRefresh);
    return NextResponse.json({ play });
  } catch (error) {
    return playErrorResponse(error);
  }
}
