import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const saved = await prisma.savedJob.findMany({
    where: { userId },
    include: { job: { include: { company: true } } },
    orderBy: { savedAt: "desc" },
  });

  const matches = await prisma.jobMatch.findMany({
    where: { userId, jobId: { in: saved.map((s: any) => s.jobId) } },
  });
  const matchByJob = new Map(matches.map((m: any) => [m.jobId, m]));

  return NextResponse.json({
    saved: saved.map((s: any) => {
      const match = matchByJob.get(s.jobId);
      const score = match
        ? Math.round(
            ((match.strongMatches.length + match.partialMatches.length * 0.5) /
              Math.max(1, match.strongMatches.length + match.partialMatches.length + match.missing.length)) *
              100
          )
        : null;
      return {
        jobId: s.jobId,
        title: s.job.title,
        company: s.job.company.name,
        location: s.job.location,
        salaryMin: s.job.salaryMin,
        salaryMax: s.job.salaryMax,
        savedAt: s.savedAt,
        matchScore: score,
      };
    }),
  });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  const saved = await prisma.savedJob.upsert({
    where: { jobId_userId: { jobId, userId } },
    update: {},
    create: { jobId, userId },
  });

  return NextResponse.json({ saved });
}

export async function DELETE(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  await prisma.savedJob.deleteMany({ where: { jobId, userId } });
  return NextResponse.json({ ok: true });
}
