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

export function WhatsAppBriefing({ className = "" }: { className?: string }) {
  const t = content.listen;
  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden bg-wa-bg ${className}`}>
      <div className="flex items-center gap-2.5 bg-wa-head px-3 py-2.5 text-white">
        <MiniMark className="size-8" />
        <span className="leading-tight">
          <span className="block text-[14px] font-medium">Saathi</span>
          <span className="block text-[11px] opacity-75">{content.hero.briefingLabel}</span>
        </span>
      </div>
      <div className="wa-paper flex-1 p-4">
        <p className="mx-auto mb-3 w-fit rounded-md bg-bg-elevated px-2 py-0.5 text-[11px] text-ink-2">
          {t.example}
        </p>
        <div className="max-w-[92%] rounded-[14px] rounded-tl-[4px] bg-bg-elevated p-3 text-[14px] leading-relaxed text-ink">
          <p>{t.briefing}</p>
          <p className="mt-2 text-[12px] text-ink-2">{t.briefingFooter}</p>
          <p className="mt-2 text-right font-mono text-[11px] text-ink-2">{t.briefingTime}</p>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppAlert({ className = "" }: { className?: string }) {
  const t = content.desk;
  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden bg-wa-bg ${className}`}>
      <div className="flex items-center gap-2.5 bg-wa-head px-3 py-2.5 text-white">
        <MiniMark className="size-8" />
        <span className="leading-tight">
          <span className="block text-[14px] font-medium">Saathi</span>
          <span className="block text-[11px] opacity-75">{t.waTag}</span>
        </span>
      </div>
      <div className="wa-paper flex-1 p-4">
        <p className="mx-auto mb-3 w-fit rounded-md bg-bg-elevated px-2 py-0.5 text-[11px] text-ink-2">
          {content.listen.example}
        </p>
        <div className="max-w-[92%] rounded-[14px] rounded-tl-[4px] bg-bg-elevated p-3 text-[14px] leading-relaxed text-ink">
          <p>{t.waBody}</p>
          <p className="mt-2 text-right font-mono text-[11px] text-ink-2">{t.waTime}</p>
        </div>
      </div>
    </div>
  );
}
