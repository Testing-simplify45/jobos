import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const coverLetters = await prisma.coverLetter.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ coverLetters });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { content, isMaster } = await req.json();
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  // Only one master at a time — unset any previous master before creating.
  if (isMaster) {
    await prisma.coverLetter.updateMany({
      where: { userId, isMaster: true },
      data: { isMaster: false },
    });
  }

  const coverLetter = await prisma.coverLetter.create({
    data: {
      userId,
      label: isMaster ? "Master Cover Letter" : `Draft — ${new Date().toISOString().slice(0, 10)}`,
      content,
      isMaster: !!isMaster,
    },
  });

  return NextResponse.json({ coverLetter });
}
