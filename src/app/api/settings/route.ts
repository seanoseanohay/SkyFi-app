import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encrypt";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const secrets = await prisma.userSecret.findUnique({ where: { userId } });
  if (!secrets) {
    return NextResponse.json({
      skyfiKeySet: false,
      aiProvider: "claude",
      aiKeySet: false,
    });
  }
  return NextResponse.json({
    skyfiKeySet: !!secrets.skyfiKey,
    aiProvider: secrets.aiProvider,
    aiKeySet: !!secrets.aiKey,
    skyfiKeyPreview: secrets.skyfiKey
      ? "••••••••" + decrypt(secrets.skyfiKey).slice(-4)
      : null,
    aiKeyPreview: secrets.aiKey
      ? "••••••••" + decrypt(secrets.aiKey).slice(-4)
      : null,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { skyfiKey, aiProvider, aiKey } = await req.json();

  const data: Record<string, string> = {};
  if (skyfiKey) data.skyfiKey = encrypt(skyfiKey);
  if (aiProvider) data.aiProvider = aiProvider;
  if (aiKey) data.aiKey = encrypt(aiKey);

  await prisma.userSecret.upsert({
    where: { userId },
    update: data,
    create: { userId, skyfiKey: data.skyfiKey ?? "", aiProvider: data.aiProvider ?? "claude", aiKey: data.aiKey ?? "" },
  });

  return NextResponse.json({ ok: true });
}
