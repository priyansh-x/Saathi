"use client";

import { useState } from "react";
import type { WhatsappPreview } from "@/lib/whatsapp/preview";

export function WhatsappPreviewPanel({ preview }: { preview: WhatsappPreview | null }) {
  const [open, setOpen] = useState(false);
  if (!preview) {
    return <p className="mt-3 text-sm text-muted-foreground">No call or alert to preview yet.</p>;
  }
  return (
    <div className="mt-3">
      <button type="button" className="btn-secondary" onClick={() => setOpen((value) => !value)}>
        Preview only. Sends nothing
      </button>
      {open ? (
        <div className="mt-3 space-y-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <p>
            <span className="font-medium">{preview.template}</span> · {preview.language}
          </p>
          <p className="whitespace-pre-wrap">{preview.body}</p>
          <p className="text-xs text-ink-3">{preview.gate}</p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] text-ink-3">
            {preview.payloadJson}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
