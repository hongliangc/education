import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AliyunApiError, AliyunConfigError } from "@/lib/aliyun/client";
import { getVideoCatalog } from "@/lib/video/catalog";
import { prisma } from "@/lib/db";
import { mergeVideoUnlockState } from "@/lib/video/unlock";

function videoErrorResponse(error: unknown) {
  if (error instanceof AliyunConfigError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof AliyunApiError) {
    const status = error.status === 404 ? 404 : error.status === 503 ? 503 : 502;
    return NextResponse.json({ error: "video_service_unavailable" }, { status });
  }
  return NextResponse.json({ error: "video_service_unavailable" }, { status: 502 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const childId = url.searchParams.get("childId") ?? "";
    if (!childId) {
      return NextResponse.json({ error: "child_required" }, { status: 400 });
    }

    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: session.user.id },
      select: { id: true },
    });
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const forceRefresh = url.searchParams.get("refresh") === "1";
    const videos = await getVideoCatalog(forceRefresh);
    const unlocks = await prisma.videoUnlock.findMany({
      where: { childId },
      select: { videoId: true },
    });
    const unlockedIds = new Set(unlocks.map((unlock) => unlock.videoId));
    return NextResponse.json({ videos: mergeVideoUnlockState(videos, unlockedIds) });
  } catch (error) {
    return videoErrorResponse(error);
  }
}
