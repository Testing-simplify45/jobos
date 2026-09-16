import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { adaptCoverLetter } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const master = await prisma.coverLetter.findFirst({ where: { userId, isMaster: true } });
  if (!master) {
    return NextResponse.json(
      { error: "No master cover letter set yet — add one in Cover Letter Studio first." },
      { status: 400 }
    );
  }

  try {
    const adapted = await adaptCoverLetter(params.id, userId, master.id);
    if (!adapted) throw new Error("No content returned");

    const saved = await prisma.coverLetter.create({
      data: { userId, label: `Tailored — ${new Date().toISOString().slice(0, 10)}`, content: adapted.content },
    });

    return NextResponse.json({ coverLetterId: saved.id, content: adapted.content, changes: adapted.changesSummary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Cover letter generation failed" }, { status: 500 });
  }
}
