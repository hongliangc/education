// app/api/reading/[childId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReadingProgress, upsertReadingProgress } from "@/lib/services/reading";

async function ownedChild(childId: string, parentId: string) {
  return prisma.child.findFirst({ where: { id: childId, parentId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { childId } = await params;
  const child = await ownedChild(childId, session.user.id);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progress = await getReadingProgress(childId);
  return NextResponse.json({ progress });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { childId } = await params;
  const child = await ownedChild(childId, session.user.id);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const bookId = String(body.bookId ?? "");
  const lastChapterIdx = Math.max(0, Math.floor(Number(body.lastChapterIdx) || 0));
  const completedChapters = Math.max(0, Math.floor(Number(body.completedChapters) || 0));
  const finished = Boolean(body.finished);
  if (!bookId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const progress = await upsertReadingProgress({
    childId,
    bookId,
    lastChapterIdx,
    completedChapters,
    finished,
  });
  return NextResponse.json({ progress });
}
