import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { company, role, skills } = await req.json();
  if (!company || !role) {
    return NextResponse.json({ error: "company and role are required" }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const experience = await prisma.experience.create({
    data: {
      profileId: profile.id,
      company,
      role,
      skills: Array.isArray(skills) ? skills : [],
    },
  });

  return NextResponse.json({ experience });
}
