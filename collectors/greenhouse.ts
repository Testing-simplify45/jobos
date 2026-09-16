/**
 * Greenhouse Job Board API collector.
 *
 * Greenhouse exposes a public, unauthenticated JSON feed per company:
 *   https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 *
 * The `board_token` is the company's slug on Greenhouse, usually visible in
 * their careers URL, e.g. boards.greenhouse.io/{board_token}.
 *
 * This runs on a normal server/deploy target with outbound internet access
 * (Vercel, a cron worker, etc). It will NOT run inside this sandboxed
 * container, whose network egress is restricted to a short allow-list.
 */

import { AtsType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";


interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  location: { name: string };
  content: string; // HTML job description
  absolute_url: string;
  departments: { name: string }[];
}

interface GreenhouseBoardResponse {
  jobs: GreenhouseJob[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalHash(company: string, normalizedTitle: string, location: string): string {
  return crypto
    .createHash("sha256")
    .update(`${company.toLowerCase()}|${normalizedTitle}|${location.toLowerCase()}`)
    .digest("hex");
}

export async function fetchGreenhouseBoard(boardToken: string): Promise<GreenhouseJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`
  );
  if (!res.ok) {
    throw new Error(`Greenhouse fetch failed for ${boardToken}: ${res.status} ${res.statusText}`);
  }
  const data: GreenhouseBoardResponse = await res.json();
  return data.jobs;
}

/**
 * Pulls a single company's Greenhouse board and upserts jobs into the DB.
 * Marks jobs previously seen but no longer returned as STALE, so the
 * dashboard can flag "possibly closed" without deleting history.
 */
export async function syncGreenhouseCompany(companyName: string, boardToken: string) {
  const company = await prisma.company.upsert({
    where: { name: companyName },
    update: { atsType: AtsType.GREENHOUSE, atsSlug: boardToken },
    create: {
      name: companyName,
      atsType: AtsType.GREENHOUSE,
      atsSlug: boardToken,
    },
  });

  const jobs = await fetchGreenhouseBoard(boardToken);
  const seenExternalIds = new Set<string>();

  for (const gh of jobs) {
    const externalId = String(gh.id);
    seenExternalIds.add(externalId);

    const normalizedTitle = normalizeTitle(gh.title);
    const location = gh.location?.name ?? "Unknown";
    const hash = canonicalHash(companyName, normalizedTitle, location);
    const description = stripHtml(gh.content);

    const existing = await prisma.job.findFirst({
      where: { companyId: company.id, externalId, source: "greenhouse" },
    });

    if (existing) {
      await prisma.job.update({
        where: { id: existing.id },
        data: {
          title: gh.title,
          normalizedTitle,
          location,
          description,
          sourceUrl: gh.absolute_url,
          lastSeenAt: new Date(),
          status: "OPEN",
        },
      });
    } else {
      await prisma.job.create({
        data: {
          companyId: company.id,
          title: gh.title,
          normalizedTitle,
          location,
          remote: /remote/i.test(location) || /remote/i.test(gh.title),
          description,
          requirements: [], // filled in later by the AI Job Parser step
          skills: [],
          keywords: [],
          source: "greenhouse",
          sourceUrl: gh.absolute_url,
          externalId,
          canonicalHash: hash,
          postedAt: gh.updated_at ? new Date(gh.updated_at) : null,
          jobSources: {
            create: [{ source: "greenhouse", url: gh.absolute_url }],
          },
        },
      });
    }
  }

  // Anything previously synced from this board but not in this response
  // anymore: mark STALE rather than deleting, so history/tracker stays intact.
  const staleCandidates = await prisma.job.findMany({
    where: { companyId: company.id, source: "greenhouse", status: "OPEN" },
  });
  for (const job of staleCandidates) {
    if (job.externalId && !seenExternalIds.has(job.externalId)) {
      await prisma.job.update({ where: { id: job.id }, data: { status: "STALE" } });
    }
  }

  return { company: companyName, jobsSeen: jobs.length };
}

/**
 * Run this on a schedule (cron / background worker) across all companies
 * you're tracking, e.g.:
 *
 *   for (const { name, token } of trackedGreenhouseCompanies) {
 *     await syncGreenhouseCompany(name, token);
 *   }
 */
