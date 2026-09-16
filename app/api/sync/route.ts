import { NextResponse } from "next/server";
import { syncGreenhouseCompany } from "@/collectors/greenhouse";
import { syncLeverCompany } from "@/collectors/lever";

/**
 * Configure the companies you want to track here. board/slug values are
 * the token visible in that company's careers URL:
 *   boards.greenhouse.io/{board_token}
 *   jobs.lever.co/{company_slug}
 *
 * Trigger this endpoint via Vercel Cron (recommended) or by hitting it
 * manually while testing. Protect it with CRON_SECRET so randoms on the
 * internet can't spam your OpenAI/DB usage by hitting it directly.
 */
const TRACKED_GREENHOUSE: { name: string; boardToken: string }[] = [
  { name: "WeightWatchers", boardToken: "ww" },
];

const TRACKED_LEVER: { name: string; slug: string }[] = [
  // { name: "Netflix", slug: "netflix" },
];

async function runSync(req: Request) {
  // Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET`
  // when CRON_SECRET is set in env vars — this checks that, and also
  // accepts x-cron-secret for manual testing via curl.
  const authHeader = req.headers.get("authorization");
  const manualSecret = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;

  if (expected && authHeader !== `Bearer ${expected}` && manualSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: any[] = [];

  for (const { name, boardToken } of TRACKED_GREENHOUSE) {
    try {
      results.push(await syncGreenhouseCompany(name, boardToken));
    } catch (e: any) {
      results.push({ company: name, error: e.message });
    }
  }

  for (const { name, slug } of TRACKED_LEVER) {
    try {
      results.push(await syncLeverCompany(name, slug));
    } catch (e: any) {
      results.push({ company: name, error: e.message });
    }
  }

  if (TRACKED_GREENHOUSE.length === 0 && TRACKED_LEVER.length === 0) {
    return NextResponse.json({
      message:
        "No companies configured yet — add entries to TRACKED_GREENHOUSE / TRACKED_LEVER in app/api/sync/route.ts",
      results: [],
    });
  }

  return NextResponse.json({ results });
}

// Vercel Cron calls this with GET. Kept POST too for manual triggering.
export async function GET(req: Request) {
  return runSync(req);
}
export async function POST(req: Request) {
  return runSync(req);
}
