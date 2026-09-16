/**
 * Manual / "paste it in" intake path.
 *
 * For sources with no public API — LinkedIn, Notion career pages, Wellfound,
 * custom company sites — we don't scrape. Instead the user (or the browser
 * extension, later) pastes the job URL + raw description text, and we run
 * it through the same normalization/dedup/AI-parsing pipeline as the ATS
 * collectors.
 *
 * This keeps LinkedIn's ToS and anti-bot boundary intact while still letting
 * those jobs live in the same database, matched and tracked the same way.
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";


function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function canonicalHash(company: string, normalizedTitle: string, location: string): string {
  return crypto
    .createHash("sha256")
    .update(`${company.toLowerCase()}|${normalizedTitle}|${location.toLowerCase()}`)
    .digest("hex");
}

export interface ManualJobInput {
  companyName: string;
  title: string;
  location: string;
  description: string;
  sourceUrl: string;
  source: "linkedin-url" | "notion" | "custom-career-page" | "manual";
}

export async function intakeManualJob(input: ManualJobInput) {
  const company = await prisma.company.upsert({
    where: { name: input.companyName },
    update: {},
    create: { name: input.companyName, atsType: "MANUAL" },
  });

  const normalizedTitle = normalizeTitle(input.title);
  const hash = canonicalHash(input.companyName, normalizedTitle, input.location);

  // Dedup against anything already discovered for this company+title+location,
  // regardless of source — this is the "found on N sources" merge point.
  const existing = await prisma.job.findFirst({ where: { canonicalHash: hash } });

  if (existing) {
    await prisma.job.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        jobSources: { create: [{ source: input.source, url: input.sourceUrl }] },
      },
    });
    return existing;
  }

  return prisma.job.create({
    data: {
      companyId: company.id,
      title: input.title,
      normalizedTitle,
      location: input.location,
      remote: /remote/i.test(input.location) || /remote/i.test(input.title),
      description: input.description,
      requirements: [],
      skills: [],
      keywords: [],
      source: input.source,
      sourceUrl: input.sourceUrl,
      canonicalHash: hash,
      jobSources: { create: [{ source: input.source, url: input.sourceUrl }] },
    },
  });
}
