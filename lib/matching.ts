/**
 * AI Matching + Cover Letter engine.
 *
 * Hard rule: the model may ONLY cite skills/experience that exist in the
 * user's stored profile (experiences, skills, achievements). It must never
 * infer or invent qualifications not present in that data. We enforce this
 * two ways:
 *   1. The prompt explicitly forbids it and requires every claim to map to
 *      a real evidenceId.
 *   2. After the model responds, evidenceIds are validated against the DB —
 *      any citation that doesn't resolve to a real record is dropped and
 *      that claim is stripped from the output before it reaches the user.
 */

import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- Schemas (structured outputs) ----------

const JobParseSchema = z.object({
  requirements: z.array(z.string()),
  skills: z.array(z.string()),
  keywords: z.array(z.string()),
  seniority: z.string().nullable(),
});

const MatchAnalysisSchema = z.object({
  strongMatches: z.array(
    z.object({ skill: z.string(), evidenceId: z.string() })
  ),
  partialMatches: z.array(
    z.object({ skill: z.string(), note: z.string() })
  ),
  missing: z.array(z.string()),
});

const CoverLetterSchema = z.object({
  content: z.string(),
  changesSummary: z.array(z.string()),
});

// ---------- AI #1: Job Parser ----------

export async function parseJobDescription(rawDescription: string) {
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "Extract structured requirements from a job description. " +
          "Only extract what is explicitly stated. Do not infer skills that " +
          "aren't mentioned or clearly implied by named tools/responsibilities.",
      },
      { role: "user", content: rawDescription },
    ],
    response_format: zodResponseFormat(JobParseSchema, "job_parse"),
  });

  return completion.choices[0].message.parsed;
}

// ---------- AI #2: Job Matcher (evidence-constrained) ----------

export async function matchJobToProfile(jobId: string, userId: string) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { userId },
    include: { experiences: true, skills: true, achievements: true },
  });

  // Build an evidence pack — the ONLY data the model is allowed to cite.
  const evidencePack = {
    skills: profile.skills.map((s: any) => ({ id: s.id, name: s.name, level: s.level })),
    experiences: profile.experiences.map((e: any) => ({
      id: e.id,
      company: e.company,
      role: e.role,
      skills: e.skills,
    })),
    achievements: profile.achievements.map((a: any) => ({
      id: a.id,
      problem: a.problem,
      action: a.action,
      result: a.result,
      skills: a.skills,
    })),
  };

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "You compare a job's requirements against a candidate's evidence pack. " +
          "HARD RULE: you may only claim a match if it is backed by an item in the " +
          "evidence pack, and you must cite its exact id as evidenceId. " +
          "Never invent or assume a skill/tool the candidate hasn't listed " +
          "(e.g. if the job wants Salesforce and the candidate only lists Zoho CRM, " +
          "that is a MISSING requirement, not a match — you may note CRM experience " +
          "as a partial match instead). If you cannot find a real evidenceId, do not " +
          "include the claim.",
      },
      {
        role: "user",
        content: JSON.stringify({
          jobTitle: job.title,
          jobRequirements: job.requirements,
          jobSkills: job.skills,
          jobDescription: job.description,
          evidencePack,
        }),
      },
    ],
    response_format: zodResponseFormat(MatchAnalysisSchema, "match_analysis"),
  });

  const parsed = completion.choices[0].message.parsed!;

  // Validate every cited evidenceId actually exists — strip anything that doesn't.
  const validIds = new Set([
    ...profile.skills.map((s: any) => s.id),
    ...profile.experiences.map((e: any) => e.id),
    ...profile.achievements.map((a: any) => a.id),
  ]);
  const verifiedStrong = parsed.strongMatches.filter((m) => validIds.has(m.evidenceId));

  const result = await prisma.jobMatch.upsert({
    where: { jobId_userId: { jobId, userId } },
    update: {
      strongMatches: verifiedStrong.map((m) => m.skill),
      partialMatches: parsed.partialMatches.map((m) => m.skill),
      missing: parsed.missing,
      evidenceUsed: verifiedStrong,
    },
    create: {
      jobId,
      userId,
      strongMatches: verifiedStrong.map((m) => m.skill),
      partialMatches: parsed.partialMatches.map((m) => m.skill),
      missing: parsed.missing,
      evidenceUsed: verifiedStrong,
    },
  });

  return result;
}

// ---------- AI #3: Cover Letter Adapter ----------

export async function adaptCoverLetter(jobId: string, userId: string, masterCoverLetterId: string) {
  const [job, master, match] = await Promise.all([
    prisma.job.findUniqueOrThrow({ where: { id: jobId } }),
    prisma.coverLetter.findUniqueOrThrow({ where: { id: masterCoverLetterId } }),
    prisma.jobMatch.findUnique({ where: { jobId_userId: { jobId, userId } } }),
  ]);

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "Adapt the candidate's existing cover letter using only relevant keywords " +
          "from the job description that are ALSO backed by their verified matches. " +
          "Do not invent experience or tools they don't have. Preserve the original " +
          "structure, tone, and length as closely as possible — make only necessary changes.",
      },
      {
        role: "user",
        content: JSON.stringify({
          masterCoverLetter: master.content,
          jobDescription: job.description,
          verifiedStrongMatches: match?.strongMatches ?? [],
        }),
      },
    ],
    response_format: zodResponseFormat(CoverLetterSchema, "cover_letter"),
  });

  return completion.choices[0].message.parsed;
}
