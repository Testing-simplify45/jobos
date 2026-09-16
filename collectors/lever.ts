/**
 * Lever public postings API collector.
 *
 *   https://api.lever.co/v0/postings/{company_slug}?mode=json
 *
 * No auth required. `company_slug` is visible in jobs.lever.co/{slug}.
 * Same network caveat as greenhouse.ts — run this where outbound internet
 * is unrestricted.
 */

import { AtsType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";


interface LeverPosting {
  id: string;
  text: string; // title
  categories: { location?: string; team?: string; commitment?: string };
  descriptionPlain: string;
  hostedUrl: string;
  createdAt: number; // epoch ms
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function canonicalHash(company: string, normalizedTitle: string, location: string): string {
  return crypto
    .createHash("sha256")
    .update(`${company.toLowerCase()}|${normalizedTitle}|${location.toLowerCase()}`)
    .digest("hex");
}

export async function fetchLeverPostings(companySlug: string): Promise<LeverPosting[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${companySlug}?mode=json`);
  if (!res.ok) {
    throw new Error(`Lever fetch failed for ${companySlug}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function syncLeverCompany(companyName: string, companySlug: string) {
  const company = await prisma.company.upsert({
    where: { name: companyName },
    update: { atsType: AtsType.LEVER, atsSlug: companySlug },
    create: { name: companyName, atsType: AtsType.LEVER, atsSlug: companySlug },
  });

  const postings = await fetchLeverPostings(companySlug);
  const seenIds = new Set<string>();

  for (const p of postings) {
    seenIds.add(p.id);
    const normalizedTitle = normalizeTitle(p.text);
    const location = p.categories?.location ?? "Unknown";
    const hash = canonicalHash(companyName, normalizedTitle, location);

    const existing = await prisma.job.findFirst({
      where: { companyId: company.id, externalId: p.id, source: "lever" },
    });

    if (existing) {
      await prisma.job.update({
        where: { id: existing.id },
        data: {
          title: p.text,
          normalizedTitle,
          location,
          description: p.descriptionPlain,
          sourceUrl: p.hostedUrl,
          lastSeenAt: new Date(),
          status: "OPEN",
        },
      });
    } else {
      await prisma.job.create({
        data: {
          companyId: company.id,
          title: p.text,
          normalizedTitle,
          location,
          remote: /remote/i.test(location) || /remote/i.test(p.text),
          description: p.descriptionPlain,
          requirements: [],
          skills: [],
          keywords: [],
          source: "lever",
          sourceUrl: p.hostedUrl,
          externalId: p.id,
          canonicalHash: hash,
          postedAt: new Date(p.createdAt),
          jobSources: { create: [{ source: "lever", url: p.hostedUrl }] },
        },
      });
    }
  }

  const staleCandidates = await prisma.job.findMany({
    where: { companyId: company.id, source: "lever", status: "OPEN" },
  });
  for (const job of staleCandidates) {
    if (job.externalId && !seenIds.has(job.externalId)) {
      await prisma.job.update({ where: { id: job.id }, data: { status: "STALE" } });
    }
  }

  return { company: companyName, jobsSeen: postings.length };
}
