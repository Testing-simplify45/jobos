import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { matchJobToProfile, parseJobDescription } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Parse requirements/skills out of the raw description the first time
  // a job is matched against, so future matches don't re-parse it.
  if (job.requirements.length === 0) {
    try {
      const parsed = await parseJobDescription(job.description);
      if (parsed) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            requirements: parsed.requirements,
            skills: parsed.skills,
            keywords: parsed.keywords,
          },
        });
      }
    } catch (e) {
      // Non-fatal — matching can still run against raw description text.
      console.error("Job parse failed", e);
    }
  }

  try {
    const match = await matchJobToProfile(job.id, userId);
    return NextResponse.json({ match });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Matching failed" }, { status: 500 });
  }
}
