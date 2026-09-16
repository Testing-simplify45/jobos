"use client";

import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { MatchBadge } from "@/components/ui";

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string[];
  postedAt: string | null;
  matchScore: number | null;
}

export default function FindJobsPage() {
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<JobResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    setError(null);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (remoteOnly) params.set("remote", "true");

    const res = await fetch(`/api/jobs?${params.toString()}`);
    if (!res.ok) {
      setError("Failed to load jobs");
      return;
    }
    const data = await res.json();
    setJobs(data.jobs);
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex w-full max-w-lg items-center gap-2 rounded-md border border-base-border bg-base-panel px-3 py-2 text-[13px]">
            <Search size={15} className="text-text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search roles, skills, or companies"
              className="w-full bg-transparent text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-text-secondary" />
          </div>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => setRemoteOnly((r) => !r)}
            className={`rounded-md border px-3 py-1.5 text-[13px] ${
              remoteOnly
                ? "border-accent bg-accent-dim text-accent"
                : "border-base-border text-text-secondary hover:bg-base-panel"
            }`}
          >
            Remote only
          </button>
          <button
            onClick={runSearch}
            className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-base-bg hover:bg-accent-bright"
          >
            Search
          </button>
        </div>

        <div className="mb-4">
          <h1 className="text-xl font-semibold text-text-primary">Recommended for you</h1>
          <p className="text-[13px] text-text-secondary">
            {jobs ? `Found ${jobs.length} jobs matching your search` : "Loading…"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-card border border-warn/40 bg-warn-dim px-4 py-3 text-[13px] text-warn">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {(jobs ?? []).map((job) => (
            <div
              key={job.id}
              className="flex flex-col rounded-card border border-base-border bg-base-panel p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <span className="text-[11px] text-text-tertiary">
                  {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : ""}
                </span>
                {job.matchScore !== null ? (
                  <MatchBadge score={job.matchScore} />
                ) : (
                  <span className="rounded-full bg-base-panelAlt px-2 py-1 text-[11px] text-text-tertiary">
                    not analyzed
                  </span>
                )}
              </div>

              <h3 className="text-[15px] font-semibold text-text-primary">{job.title}</h3>
              <p className="mb-3 text-[13px] text-text-secondary">
                {job.company}
                {job.location ? ` · ${job.location}` : ""}
              </p>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-base-border px-2 py-0.5 text-[12px] text-text-secondary"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">
                  {job.salaryMin && job.salaryMax
                    ? `$${job.salaryMin.toLocaleString()}–$${job.salaryMax.toLocaleString()}`
                    : "—"}
                </span>
                <a
                  href={`/jobs/${job.id}`}
                  className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-base-bg hover:bg-accent-bright"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}

          {jobs && jobs.length === 0 && (
            <div className="col-span-3 rounded-card border border-dashed border-base-border p-8 text-center text-[13px] text-text-tertiary">
              No jobs yet — run a sync from the AI Hub, or add one manually, to see results here.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
