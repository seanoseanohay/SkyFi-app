import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const subs = await prisma.aoiSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ subscriptions: subs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { subscriptionId, label, aoiWkt } = await req.json();
  if (!subscriptionId || !aoiWkt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const sub = await prisma.aoiSubscription.create({
    data: { userId, subscriptionId, label, aoiWkt },
  });
  return NextResponse.json({ subscription: sub }, { status: 201 });
}
