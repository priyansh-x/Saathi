"use client";

import { useState } from "react";

export function InviteForm({ token, label, hint }: { token: string; label: string; hint: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    const res = await fetch(`/api/d/${token}/invite`, { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; error?: string; url?: string };
    if (!res.ok || !data.url) {
      setError(data.error || "Could not create an invite.");
      return;
    }
    setUrl(data.url);
  }

  return (
    <div className="mt-3 space-y-2">
      <button type="button" className="btn-secondary" onClick={create}>
        {label}
      </button>
      {url ? <p className="break-all text-sm">{url}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
