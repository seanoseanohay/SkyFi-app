import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database is not configured. Add DATABASE_URL in Railway (reference the Postgres service)." },
        { status: 503 }
      );
    }
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, password: hashed, name } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    if (process.env.NODE_ENV === "development") {
      console.error("Register error:", err);
    }
    return NextResponse.json(
      { error: message.includes("DATABASE_URL") ? "Database not configured. Add DATABASE_URL in Railway." : "Registration failed. Try again or check server logs." },
      { status: 500 }
    );
  }
}
