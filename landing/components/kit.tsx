import { CheckCheck, ChevronLeft, Phone, Video } from "lucide-react";
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
  style,
}: {
  children: React.ReactNode;
  className?: string;
  time?: string;
  dark?: boolean;
  overlay?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`device ${dark ? "device-dark" : ""} ${className}`} style={style}>
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

export function WhatsAppBriefing({ landed = true }: { landed?: boolean }) {
  const t = content.listen;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-wa-bg text-ink">
      <div className="flex items-center gap-2.5 bg-wa-head px-3 py-2.5 text-white">
        <ChevronLeft className="size-4 opacity-80" strokeWidth={2} aria-hidden />
        <MiniMark className="size-8" />
        <span className="flex-1 leading-tight">
          <span className="block text-[14px] font-medium">Saathi</span>
          <span className="block text-[11px] opacity-75">Maa&apos;s morning briefing</span>
        </span>
        <Video className="size-4 opacity-80" strokeWidth={1.75} aria-hidden />
        <Phone className="size-4 opacity-80" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="wa-paper flex flex-1 flex-col p-3">
        <p className="mx-auto mb-3 w-fit rounded-[6px] bg-bg-elevated/80 px-2 py-0.5 text-[10.5px] text-ink-3">
          {t.example} · Today
        </p>
        {landed ? (
          <div className="screen-fade">
            <div className="relative max-w-[94%] rounded-[12px] rounded-tl-[4px] bg-bg-elevated p-3 text-[13.5px] leading-relaxed text-ink shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              <p>{t.briefing}</p>
              <p className="mt-2 text-[11.5px] text-ink-3">{t.briefingFooter}</p>
              <p className="mt-1 text-right font-mono text-[10.5px] text-ink-3">{t.briefingTime}</p>
            </div>
            <div className="mt-1.5 grid max-w-[94%] grid-cols-2 gap-1.5">
              <span className="rounded-[8px] bg-bg-elevated py-2 text-center text-[12.5px] font-medium text-wa-head">
                {t.openToday}
              </span>
              <span className="rounded-[8px] bg-bg-elevated py-2 text-center text-[12.5px] font-medium text-wa-head">
                {t.messageMaa}
              </span>
            </div>
            <div className="ml-auto mt-4 w-fit max-w-[80%] rounded-[12px] rounded-tr-[4px] bg-wa-out px-3 py-2 text-[13.5px]">
              Thank you. Calling her tonight.
              <span className="ml-2 inline-flex items-center gap-0.5 align-bottom font-mono text-[10.5px] text-ink-3">
                8:11 <CheckCheck className="size-3.5 text-sky-600" strokeWidth={2} aria-hidden />
              </span>
            </div>
          </div>
        ) : (
          <div className="flex w-fit items-center gap-2 rounded-[12px] rounded-tl-[4px] bg-bg-elevated px-3 py-2.5 text-ink-3">
            <span className="typing flex gap-1" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="text-[12px]">{t.waiting}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusDot({ tone, className = "size-2" }: { tone: "good" | "look" | "act"; className?: string }) {
  const cls = tone === "good" ? "bg-good" : tone === "look" ? "bg-look-line" : "bg-act";
  return <span className={`inline-block shrink-0 rounded-full ${cls} ${className}`} aria-hidden />;
}
