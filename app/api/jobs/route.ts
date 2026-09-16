import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const remoteOnly = searchParams.get("remote") === "true";
  const minSalary = Number(searchParams.get("minSalary") ?? 0);

  const jobs = await prisma.job.findMany({
    where: {
      status: "OPEN",
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { skills: { has: q } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(remoteOnly ? { remote: true } : {}),
      ...(minSalary ? { salaryMax: { gte: minSalary } } : {}),
    },
    include: { company: true },
    orderBy: { postedAt: "desc" },
    take: 50,
  });

  // Pull existing match scores for this user so cards can show them
  // without a separate round trip; jobs with no JobMatch yet show null
  // (frontend renders "Analyze" instead of a score).
  const matches = await prisma.jobMatch.findMany({
    where: { userId, jobId: { in: jobs.map((j: any) => j.id) } },
  });
  const matchByJob = new Map(matches.map((m: any) => [m.jobId, m]));

  const results = jobs.map((job: any) => {
    const match = matchByJob.get(job.id);
    const score = match
      ? computeScore(match.strongMatches, match.partialMatches, match.missing)
      : null;
    return {
      id: job.id,
      title: job.title,
      company: job.company.name,
      location: job.location,
      remote: job.remote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      skills: job.skills.slice(0, 4),
      postedAt: job.postedAt,
      matchScore: score,
    };
  });

  return NextResponse.json({ jobs: results, count: results.length });
}

function computeScore(strong: string[], partial: string[], missing: string[]): number {
  const total = strong.length + partial.length + missing.length;
  if (total === 0) return 0;
  return Math.round(((strong.length + partial.length * 0.5) / total) * 100);
}
