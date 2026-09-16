import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { problem, action, result, skills, experienceId } = await req.json();
  if (!problem || !action || !result) {
    return NextResponse.json({ error: "problem, action, and result are required" }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const achievement = await prisma.achievement.create({
    data: {
      profileId: profile.id,
      problem,
      action,
      result,
      skills: Array.isArray(skills) ? skills : [],
      experienceId: experienceId ?? null,
    },
  });

  return NextResponse.json({ achievement });
}
