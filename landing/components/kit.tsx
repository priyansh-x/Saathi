import { CheckCheck, ChevronLeft } from "lucide-react";
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
  overlay = false,
}: {
  children: React.ReactNode;
  className?: string;
  time?: string;
  dark?: boolean;
  overlay?: boolean;
}) {
  return (
    <div className={`device ${dark ? "device-dark" : ""} ${className}`}>
      <div className="device-screen">
        {overlay ? (
          <span className="device-island z-10" aria-hidden />
        ) : (
          <div className="device-status" aria-hidden>
            <span>{time}</span>
            <span className="device-island" />
            <span className="flex items-center gap-1">
              <span className="signal" />
              <span className="battery" />
            </span>
          </div>
        )}
        <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
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
            <p className="mx-auto mb-3 w-fit text-[11px] text-ink-3">{t.example}</p>
            <div className="relative max-w-[92%] rounded-[12px] rounded-tl-[4px] bg-bg-elevated p-3 text-[14px] leading-relaxed text-ink">
              <p>{t.briefing}</p>
              <p className="mt-2 text-[12px] text-ink-3">{t.briefingFooter}</p>
              <p className="mt-2 text-right font-mono text-[11px] text-ink-3">{t.briefingTime}</p>
            </div>
            <div className="mt-2 grid max-w-[92%] grid-cols-2 gap-2">
              <span className="rounded-[8px] bg-bg-elevated py-2 text-center text-[13px] font-medium text-wa-head">
                {t.openToday}
              </span>
              <span className="rounded-[8px] bg-bg-elevated py-2 text-center text-[13px] font-medium text-wa-head">
                {t.messageMaa}
              </span>
            </div>
            {!compact ? (
              <div className="ml-auto mt-4 w-fit max-w-[80%] rounded-[12px] rounded-tr-[4px] bg-wa-out px-3 py-2 text-[14px]">
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

export function StatusDot({ tone }: { tone: "good" | "look" | "act" }) {
  const cls = tone === "good" ? "bg-good" : tone === "look" ? "bg-look-line" : "bg-act";
  return <span className={`inline-block size-2 rounded-full ${cls}`} aria-hidden />;
}
