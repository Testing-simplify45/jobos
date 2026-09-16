import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { company: true, jobSources: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const match = await prisma.jobMatch.findUnique({
    where: { jobId_userId: { jobId: job.id, userId } },
  });

  return NextResponse.json({
    job: {
      id: job.id,
      title: job.title,
      company: job.company.name,
      location: job.location,
      remote: job.remote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      description: job.description,
      skills: job.skills,
      postedAt: job.postedAt,
      sourceUrl: job.sourceUrl,
      sourceCount: job.jobSources.length,
    },
    match: match
      ? {
          strongMatches: match.strongMatches,
          partialMatches: match.partialMatches,
          missing: match.missing,
        }
      : null,
  });
}
