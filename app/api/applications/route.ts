import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const applications = await prisma.application.findMany({
    where: { userId },
    include: { job: { include: { company: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    applications: applications.map((a: any) => ({
      id: a.id,
      jobId: a.jobId,
      status: a.status,
      title: a.job.title,
      company: a.job.company.name,
      appliedAt: a.appliedAt,
      createdAt: a.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { jobId, resumeId, coverLetterId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  // Created in PREPARING, not APPLIED — this is the "AI prepares, you
  // review, you submit" checkpoint. Status only moves to APPLIED via the
  // explicit PATCH below, after the person has actually reviewed it.
  const application = await prisma.application.create({
    data: { userId, jobId, resumeId, coverLetterId, status: "PREPARING" },
  });

  return NextResponse.json({ application });
}
