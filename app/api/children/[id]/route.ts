import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isGrade } from "@/lib/grades";

// Confirm or change a child's grade. Only the owning parent may update, and the
// grade must fall within the supported K1-G3 range.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const gradeLevel = body.gradeLevel;
  if (!isGrade(gradeLevel)) {
    return NextResponse.json({ error: "无效的年级" }, { status: 400 });
  }

  const child = await prisma.child.findFirst({
    where: { id, parentId: session.user.id },
    select: { id: true },
  });
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const updated = await prisma.child.update({
    where: { id },
    data: { gradeLevel },
  });
  return NextResponse.json({ child: updated });
}
