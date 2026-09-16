"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface CoverLetter {
  id: string;
  label: string;
  content: string;
  isMaster: boolean;
  createdAt: string;
}

export default function CoverLetterPage() {
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/cover-letters")
      .then((r) => r.json())
      .then((data) => setLetters(data.coverLetters ?? []));
  }, []);

  const master = letters.find((l) => l.isMaster);

  async function saveMaster() {
    if (!content) return;
    setSaving(true);
    const res = await fetch("/api/cover-letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, isMaster: true }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setLetters((prev) => [
        data.coverLetter,
        ...prev.map((l) => ({ ...l, isMaster: false })),
      ]);
      setContent("");
    }
  }

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <h1 className="mb-1 text-2xl font-semibold text-text-primary">Cover Letter Studio</h1>
        <p className="mb-6 text-[13px] text-text-secondary">
          Your master cover letter is what the AI adapts per job — it only swaps in relevant
          keywords that are backed by your Master Profile, never invented experience.
        </p>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 rounded-card border border-base-border bg-base-panel p-4">
            <h2 className="mb-2 text-[14px] font-semibold text-text-primary">Master Cover Letter</h2>
            {master ? (
              <p className="whitespace-pre-line text-[13px] text-text-secondary">{master.content}</p>
            ) : (
              <p className="text-[13px] text-text-tertiary">
                No master cover letter set yet — add one on the right.
              </p>
            )}
          </div>

          <div className="rounded-card border border-base-border bg-base-panel p-4">
            <h2 className="mb-3 text-[14px] font-semibold text-text-primary">
              {master ? "Replace Master" : "Set Master Cover Letter"}
            </h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Paste your general cover letter…"
              className="mb-2 w-full rounded-md border border-base-border bg-base-bg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
            />
            <button
              onClick={saveMaster}
              disabled={saving}
              className="w-full rounded-md bg-accent py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save as Master"}
            </button>
          </div>
        </div>

        {letters.filter((l) => !l.isMaster).length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-[14px] font-semibold text-text-primary">Tailored Versions</h2>
            <div className="flex flex-col gap-3">
              {letters
                .filter((l) => !l.isMaster)
                .map((l) => (
                  <div key={l.id} className="rounded-card border border-base-border bg-base-panel p-4">
                    <div className="mb-1 text-[12px] text-text-tertiary">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </div>
                    <p className="whitespace-pre-line text-[13px] text-text-secondary">{l.content}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
