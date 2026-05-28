import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const children = await prisma.child.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ children });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 16);
  const ageNum = Number(body.age);
  const avatar = String(body.avatar ?? "🌸").slice(0, 4);

  if (!name) {
    return NextResponse.json({ error: "请输入名字" }, { status: 400 });
  }
  if (!Number.isFinite(ageNum) || ageNum < 3 || ageNum > 12) {
    return NextResponse.json({ error: "年龄需在 3-12 之间" }, { status: 400 });
  }

  const child = await prisma.child.create({
    data: {
      parentId: session.user.id,
      name,
      age: Math.floor(ageNum),
      avatar,
    },
  });
  return NextResponse.json({ child });
}
