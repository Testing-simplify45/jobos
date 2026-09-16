import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { experiences: true, skills: true, achievements: true, education: true },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  return NextResponse.json({ user: { name: user?.name, email: user?.email }, profile });
}

export async function PUT(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { phone, location, linkedin, portfolio, github } = body;

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: { phone, location, linkedin, portfolio, github },
    create: { userId, phone, location, linkedin, portfolio, github },
  });

  return NextResponse.json({ profile });
}
