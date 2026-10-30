import { Check, CheckCheck, ChevronLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { MiniMark } from "@/components/chrome";
import { content } from "@/lib/content";

export function ExampleTag({ children, className = "" }: { children?: string; className?: string }) {
  return <p className={`example-tag ${className}`}>{children ?? content.listen.example}</p>;
}

/** Code-drawn phone so on-screen copy stays real text. */
export function DeviceFrame({
  children,
  className = "",
  time = "8:07",
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  time?: string;
  dark?: boolean;
}) {
  return (
    <div className={`device ${dark ? "device-dark" : ""} ${className}`}>
      <div className="device-screen">
        <div className="device-status" aria-hidden>
          <span>{time}</span>
          <span className="device-island" />
          <span className="flex items-center gap-1">
            <span className="signal" />
            <span className="battery" />
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function Waveform({ bars = 14, className = "" }: { bars?: number; className?: string }) {
  const heights = [40, 70, 55, 90, 60, 100, 45, 80, 65, 95, 50, 75, 60, 85, 45, 70];
  return (
    <span className={`wave-bars flex h-6 items-center gap-[3px] ${className}`} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} style={{ "--i": i, height: `${heights[i % heights.length]}%` } as CSSProperties} />
      ))}
    </span>
  );
}

export function WhatsAppBriefing({
  compact = false,
  className = "",
  landed = true,
}: {
  compact?: boolean;
  className?: string;
  landed?: boolean;
}) {
  const t = content.listen;
  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden bg-wa-bg ${className}`}>
      <div className="flex items-center gap-2.5 bg-wa-head px-3 py-2.5 text-white">
        <ChevronLeft className="size-4 opacity-80" strokeWidth={2} aria-hidden />
        <MiniMark className="size-8" />
        <span className="leading-tight">
          <span className="block text-[14px] font-medium">Saathi</span>
          <span className="block text-[11px] opacity-75">Maa&apos;s morning briefing</span>
        </span>
      </div>
      <div className={`wa-paper flex-1 ${compact ? "p-3" : "p-4"}`}>
        {landed ? (
          <>
            <p className="mx-auto mb-3 w-fit rounded-md bg-bg-elevated/80 px-2 py-0.5 text-[11px] text-ink-3">
              {t.example}
            </p>
            <div className="relative max-w-[92%] rounded-[14px] rounded-tl-[4px] bg-bg-elevated p-3 text-[14px] leading-relaxed text-ink shadow-sm">
              <p>{t.briefing}</p>
              <p className="mt-2 text-[12px] text-ink-3">{t.briefingFooter}</p>
              <p className="mt-2 flex items-center justify-end gap-1 font-mono text-[11px] text-ink-3">
                {t.briefingTime}
              </p>
            </div>
            <div className="mt-2 grid max-w-[92%] grid-cols-2 gap-2">
              <span className="rounded-[10px] bg-bg-elevated py-2 text-center text-[13px] font-medium text-wa-head shadow-sm">
                {t.openToday}
              </span>
              <span className="rounded-[10px] bg-bg-elevated py-2 text-center text-[13px] font-medium text-wa-head shadow-sm">
                {t.messageMaa}
              </span>
            </div>
            {!compact ? (
              <div className="ml-auto mt-4 w-fit max-w-[80%] rounded-[14px] rounded-tr-[4px] bg-wa-out px-3 py-2 text-[14px] shadow-sm">
                Thank you. Calling her tonight.
                <span className="ml-2 inline-flex items-center gap-0.5 align-bottom font-mono text-[11px] text-ink-3">
                  8:11 <CheckCheck className="size-3.5 text-sky-600" strokeWidth={2} aria-hidden />
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-10 text-center text-[13px] text-ink-3">{t.waiting}</p>
        )}
      </div>
    </div>
  );
}

export function Tick({ className = "" }: { className?: string }) {
  return <Check className={`size-4 shrink-0 text-good ${className}`} strokeWidth={2} aria-hidden />;
}

export function StatusDot({ tone }: { tone: "good" | "look" | "act" }) {
  const cls = tone === "good" ? "bg-good" : tone === "look" ? "bg-look-line" : "bg-act";
  return <span className={`inline-block size-2 rounded-full ${cls}`} aria-hidden />;
}
