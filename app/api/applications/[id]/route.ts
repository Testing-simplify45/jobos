import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const VALID_STATUSES = [
  "DISCOVERED",
  "SAVED",
  "PREPARING",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application || application.userId !== userId) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: {
      status,
      // appliedAt is only ever set the moment a human moves it to APPLIED —
      // this is the review checkpoint, never set automatically elsewhere.
      ...(status === "APPLIED" && !application.appliedAt ? { appliedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ application: updated });
}
