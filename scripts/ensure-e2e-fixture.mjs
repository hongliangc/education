import { pathToFileURL } from "node:url";

const DEFAULT_CHILD_NAME = "验收小朋友";

export function readE2eFixtureConfig(env) {
  if (env.NODE_ENV === "production") {
    throw new Error("E2E fixture must not run in production");
  }

  const parentEmail = env.E2E_PARENT_EMAIL?.trim();
  const parentPassword = env.E2E_PARENT_PASSWORD ?? "";
  if (!parentEmail || parentPassword.length < 6) {
    throw new Error(
      "E2E_PARENT_EMAIL and E2E_PARENT_PASSWORD (at least 6 characters) are required",
    );
  }

  return {
    parentEmail,
    parentPassword,
    childName: env.E2E_CHILD_NAME?.trim() || DEFAULT_CHILD_NAME,
    childAge: Number.parseInt(env.E2E_CHILD_AGE ?? "7", 10),
    childGradeLevel: env.E2E_CHILD_GRADE?.trim() || "G1",
  };
}

export async function ensureE2eFixture(config, adapter) {
  const parent = await adapter.upsertParent({
    email: config.parentEmail,
    password: config.parentPassword,
  });
  const child = await adapter.upsertChild({
    parentId: parent.id,
    name: config.childName,
    age: config.childAge,
    gradeLevel: config.childGradeLevel,
  });
  return { parentId: parent.id, childId: child.id };
}

async function main() {
  const { loadEnvConfig } = (await import("@next/env")).default;
  loadEnvConfig(process.cwd());
  const config = readE2eFixtureConfig(process.env);

  const [{ PrismaClient }, bcrypt] = await Promise.all([
    import("@prisma/client"),
    import("bcryptjs"),
  ]);
  const prisma = new PrismaClient();
  try {
    const result = await ensureE2eFixture(config, {
      async upsertParent({ email, password }) {
        const passwordHash = await bcrypt.default.hash(password, 10);
        return prisma.user.upsert({
          where: { email },
          update: { passwordHash, role: "PARENT" },
          create: { email, passwordHash, role: "PARENT" },
        });
      },
      async upsertChild(input) {
        const existing = await prisma.child.findFirst({
          where: { parentId: input.parentId, name: input.name },
        });
        if (existing) {
          return prisma.child.update({
            where: { id: existing.id },
            data: { age: input.age, gradeLevel: input.gradeLevel },
          });
        }
        return prisma.child.create({ data: input });
      },
    });
    process.stdout.write(`E2E fixture ready (parent=${result.parentId}, child=${result.childId})\n`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
