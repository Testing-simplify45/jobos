import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth"; // TODO: wire to real auth (NextAuth/Clerk)


/**
 * Computes a transparent 0-100 match score from verified matches instead of
 * having the model state a number directly. strongMatches carry full weight,
 * partialMatches carry half weight, missing requirements pull the score down.
 */
function computeMatchScore(strong: string[], partial: string[], missing: string[]): number {
  const totalConsidered = strong.length + partial.length + missing.length;
  if (totalConsidered === 0) return 0;
  const weighted = strong.length * 1 + partial.length * 0.5;
  return Math.round((weighted / totalConsidered) * 100);
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [applications, matches, savedCount] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobMatch.findMany({
      where: { userId },
      include: { job: { include: { company: true } } },
    }),
    prisma.savedJob.count({ where: { userId } }),
  ]);

  const totalApplied = applications.filter((a: any) => a.status !== "DISCOVERED").length;
  const interviewing = applications.filter((a: any) => a.status === "INTERVIEW").length;
  const offers = applications.filter((a: any) => a.status === "OFFER").length;
  const successRate = totalApplied > 0 ? Math.round((offers / totalApplied) * 100) : 0;

  const scoredMatches = matches
    .map((m: any) => ({
      jobId: m.jobId,
      title: m.job.title,
      company: m.job.company.name,
      location: m.job.location,
      score: computeMatchScore(m.strongMatches, m.partialMatches, m.missing),
      skills: [...m.strongMatches, ...m.partialMatches].slice(0, 3),
      salaryMin: m.job.salaryMin,
      salaryMax: m.job.salaryMax,
      postedAt: m.job.postedAt,
    }))
    .sort((a: any, b: any) => b.score - a.score);

  const avgMatch =
    scoredMatches.length > 0
      ? Math.round(scoredMatches.reduce((sum: number, m: any) => sum + m.score, 0) / scoredMatches.length)
      : 0;

  // TODO: Application/InterviewEvent doesn't yet track a scheduled datetime —
  // add an `interviews` model (application, scheduledAt, type, mode) when you
  // wire up calendar invites, then populate `upcoming` from it.
  const upcoming: { id: string; dateLabel: string; title: string; subtitle: string }[] = [];

  // Lightweight, real activity feed derived from recent application status changes.
  const activityLog = applications
    .slice(0, 5)
    .map((a: any) => `${a.status.toLowerCase()} — ${a.job.title} at ${a.job.company.name}`);

  return NextResponse.json({
    stats: {
      totalApplied,
      interviewing,
      avgMatch,
      successRate,
      savedCount,
    },
    topMatches: scoredMatches.slice(0, 3),
    upcoming,
    activityLog,
  });
}
