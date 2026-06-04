import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AliyunApiError, AliyunConfigError, getAliyunVideoPlayInfo } from "@/lib/aliyun/client";
import { prisma } from "@/lib/db";
import { getVideoCatalog } from "@/lib/video/catalog";

function playErrorResponse(error: unknown) {
  if (error instanceof AliyunConfigError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof AliyunApiError) {
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

    const videos = await getVideoCatalog();
    const video = videos.find((item) => item.id === id);
    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (video.cost > 0) {
      const unlock = await prisma.videoUnlock.findUnique({
        where: { childId_videoId: { childId, videoId: id } },
        select: { id: true },
      });
      if (!unlock) {
        return NextResponse.json({ error: "locked" }, { status: 403 });
      }
    }

    const play = await getAliyunVideoPlayInfo(id);
    return NextResponse.json({ play });
  } catch (error) {
    return playErrorResponse(error);
  }
}
