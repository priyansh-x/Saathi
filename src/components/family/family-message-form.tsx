"use client";

import { useState } from "react";
import { FAMILY_MESSAGE_MAX } from "@/lib/family-message-limits";
import { messages, type Lang } from "@/lib/i18n/messages";

export function FamilyMessageForm({
  lang,
  action,
  initial = "",
}: {
  lang: Lang;
  action: (formData: FormData) => void | Promise<void>;
  initial?: string;
}) {
  const t = messages[lang];
  const [text, setText] = useState(initial);
  return (
    <form action={action} className="card mt-2 p-4">
      <label className="block text-[15px] font-medium" htmlFor="family-message">
        {t.familyNextCall}
      </label>
      <p className="mt-1 text-[13px] text-muted-foreground">{t.familyNextHint}</p>
      <textarea
        id="family-message"
        name="text"
        maxLength={FAMILY_MESSAGE_MAX}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, FAMILY_MESSAGE_MAX))}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-border bg-background px-3 py-2 text-[15px]"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[13px] tabular text-ink-3">
          {text.length}/{FAMILY_MESSAGE_MAX}
        </p>
        <button type="submit" className="btn-primary">
          {t.familySend}
        </button>
      </div>
    </form>
  );
}
