import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const PHONE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier) {
    return NextResponse.json({ error: "请输入手机号或邮箱" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }

  const isEmail = identifier.includes("@");
  if (isEmail && !EMAIL_RE.test(identifier)) {
    return NextResponse.json({ error: "邮箱格式错误" }, { status: 400 });
  }
  if (!isEmail && !PHONE_RE.test(identifier)) {
    return NextResponse.json({ error: "手机号格式错误" }, { status: 400 });
  }

  const where = isEmail ? { email: identifier } : { phone: identifier };
  const exists = await prisma.user.findFirst({ where });
  if (exists) {
    return NextResponse.json({ error: "该账号已存在" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      ...(isEmail ? { email: identifier } : { phone: identifier }),
      passwordHash,
    },
  });

  return NextResponse.json({ id: user.id });
}
