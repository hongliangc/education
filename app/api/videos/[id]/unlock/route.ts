import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AliyunApiError, AliyunConfigError } from "@/lib/aliyun/client";
import { prisma } from "@/lib/db";
import { getVideoCatalog } from "@/lib/video/catalog";
import { calculateUnlockQuote } from "@/lib/video/unlock";

class InsufficientStarsError extends Error {
  constructor(readonly needed: number) {
    super("insufficient_stars");
  }
}

function unlockErrorResponse(error: unknown) {
  if (error instanceof AliyunConfigError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof AliyunApiError) {
    const status = error.status === 404 ? 404 : error.status === 503 ? 503 : 502;
    return NextResponse.json({ error: "video_service_unavailable" }, { status });
  }
  return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const existing = await prisma.videoUnlock.findUnique({
      where: { childId_videoId: { childId, videoId: id } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ unlocked: true, balance: child.totalStars });
    }

    const quote = calculateUnlockQuote(video.cost, child.totalStars);
    if (!quote.canUnlock) {
      return NextResponse.json(
        { error: "insufficient_stars", needed: quote.needed },
        { status: 402 },
      );
    }

    try {
      const balance = await prisma.$transaction(async (tx) => {
        const paid = await tx.child.updateMany({
          where: {
            id: childId,
            parentId: session.user.id,
            totalStars: { gte: video.cost },
          },
          data: { totalStars: { decrement: video.cost } },
        });
        if (paid.count !== 1) {
          const latest = await tx.child.findFirst({
            where: { id: childId, parentId: session.user.id },
            select: { totalStars: true },
          });
          throw new InsufficientStarsError(Math.max(0, video.cost - (latest?.totalStars ?? 0)));
        }

        await tx.videoUnlock.create({
          data: { childId, videoId: id, starsCost: video.cost },
        });

        const updated = await tx.child.findUniqueOrThrow({
          where: { id: childId },
          select: { totalStars: true },
        });
        return updated.totalStars;
      });

      return NextResponse.json({ unlocked: true, balance });
    } catch (error) {
      if (error instanceof InsufficientStarsError) {
        return NextResponse.json(
          { error: "insufficient_stars", needed: error.needed },
          { status: 402 },
        );
      }
      if (!isUniqueConflict(error)) throw error;

      const latest = await prisma.child.findFirst({
        where: { id: childId, parentId: session.user.id },
        select: { totalStars: true },
      });
      return NextResponse.json({ unlocked: true, balance: latest?.totalStars ?? child.totalStars });
    }
  } catch (error) {
    return unlockErrorResponse(error);
  }
}
