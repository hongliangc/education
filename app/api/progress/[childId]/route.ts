import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { childId } = await params;

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
  });
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 每个模块按年级分别返回（含 LEGACY 汇总记录），由客户端按模块+年级分组展示。
  const progress = await prisma.learningProgress.findMany({
    where: { childId },
    orderBy: [{ module: "asc" }, { gradeLevel: "asc" }],
  });

  return NextResponse.json({ child, progress });
}
