"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Check, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  skills: string[];
  sourceUrl: string;
  sourceCount: number;
}
interface Match {
  strongMatches: string[];
  partialMatches: string[];
  missing: string[];
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data.job);
        setMatch(data.match);
      });
  }, [id]);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    const res = await fetch(`/api/jobs/${id}/match`, { method: "POST" });
    setAnalyzing(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Analysis failed");
      return;
    }
    const data = await res.json();
    setMatch({
      strongMatches: data.match.strongMatches,
      partialMatches: data.match.partialMatches,
      missing: data.match.missing,
    });
  }

  async function prepareApplication() {
    setPreparing(true);
    setError(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: id }),
    });
    setPreparing(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not start application");
      return;
    }
    // Lands in the AI Hub readiness checklist for this job — review before
    // anything is actually submitted, not a direct auto-submit.
    router.push("/ai-hub");
  }

  async function saveRole() {
    await fetch("/api/saved-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: id }),
    });
  }

  const score =
    match &&
    Math.round(
      ((match.strongMatches.length + match.partialMatches.length * 0.5) /
        Math.max(1, match.strongMatches.length + match.partialMatches.length + match.missing.length)) *
        100
    );

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <a
            href="/find-jobs"
            className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft size={15} /> Back to search
          </a>
          <div className="flex gap-2">
            <button
              onClick={saveRole}
              className="flex items-center gap-1.5 rounded-md border border-base-border px-3 py-2 text-[13px] text-text-secondary hover:bg-base-panel"
            >
              <Bookmark size={14} /> Save Role
            </button>
            <button
              onClick={prepareApplication}
              disabled={preparing}
              className="rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright disabled:opacity-60"
            >
              {preparing ? "Starting…" : "Initialize AI Application"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-card border border-warn/40 bg-warn-dim px-4 py-3 text-[13px] text-warn">
            {error}
          </div>
        )}

        {!job ? (
          <p className="text-[13px] text-text-secondary">Loading…</p>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <h1 className="text-2xl font-semibold text-text-primary">{job.title}</h1>
              <p className="mb-4 text-[14px] text-text-secondary">
                {job.company} ·{" "}
                <span className={job.remote ? "text-accent" : ""}>{job.location ?? "—"}</span>
              </p>

              <div className="mb-4 flex gap-4 text-[13px] text-text-secondary">
                {(job.salaryMin || job.salaryMax) && (
                  <span>
                    ${job.salaryMin?.toLocaleString()}–${job.salaryMax?.toLocaleString()}
                  </span>
                )}
                {job.sourceCount > 1 && <span>Found on {job.sourceCount} sources</span>}
              </div>

              <div className="rounded-card border border-base-border bg-base-panel p-5">
                <h2 className="mb-3 text-[15px] font-semibold text-text-primary">About the Role</h2>
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-text-secondary">
                  {job.description}
                </p>
              </div>

              <div className="mt-4 rounded-card border border-base-border bg-base-panel p-5">
                <h2 className="mb-3 text-[15px] font-semibold text-text-primary">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-base-border px-2.5 py-1 text-[12px] text-text-secondary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-card border border-accent/40 bg-base-panel p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-accent">AI Match Analysis</h2>
                </div>

                {!match ? (
                  <button
                    onClick={analyze}
                    disabled={analyzing}
                    className="w-full rounded-md bg-accent py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright disabled:opacity-60"
                  >
                    {analyzing ? "Analyzing…" : "Run AI Match Analysis"}
                  </button>
                ) : (
                  <>
                    <div className="mb-4 text-center">
                      <div className="text-4xl font-semibold text-text-primary">{score}%</div>
                      <div className="text-[12px] text-text-tertiary">
                        {score! >= 80 ? "Strong match candidate" : "Partial match"}
                      </div>
                    </div>

                    {match.strongMatches.length > 0 && (
                      <div className="mb-3 rounded-md bg-accent-dim p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-accent">
                          <Check size={14} /> Key Strengths
                        </div>
                        <ul className="text-[12px] text-text-secondary">
                          {match.strongMatches.map((s) => (
                            <li key={s}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {match.missing.length > 0 && (
                      <div className="rounded-md bg-warn-dim p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-warn">
                          <AlertTriangle size={14} /> Identified Gaps
                        </div>
                        <ul className="text-[12px] text-text-secondary">
                          {match.missing.map((m) => (
                            <li key={m}>• {m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
