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

  // 防御陈旧 JWT 会话：会话只凭签名 cookie 验证、不查库。若 cookie 指向的家长已不在库中
  // （典型：重建本地数据库后浏览器残留旧登录），直接建小孩会撞 Child_parentId_fkey 外键。
  // 显式校验并要求重新登录，而不是把 P2003 抛成不透明的 500。
  const parent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!parent) {
    return NextResponse.json(
      { error: "登录已失效，请重新登录" },
      { status: 401 },
    );
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
