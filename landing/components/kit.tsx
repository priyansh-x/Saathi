import { Check, CheckCheck } from "lucide-react";
import { content } from "@/lib/content";

export function ExampleTag({ children }: { children?: string }) {
  return <p className="example-tag text-right">{children ?? content.listen.example}</p>;
}

export function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`phone-frame ${className}`}>{children}</div>;
}

export function WhatsAppBriefing({ compact = false }: { compact?: boolean }) {
  const t = content.listen;
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-wa-bg">
      <div className="bg-wa-head px-4 py-3 text-sm text-white">Rohit</div>
      <div className={compact ? "p-3" : "p-4"}>
        <div className="rounded-[12px] bg-bg-elevated p-3 text-[14px] leading-relaxed text-ink">
          <p>{t.briefing}</p>
          <p className="mt-2 text-[12px] text-ink-2">{t.briefingFooter}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-1.5 text-xs">{t.openToday}</span>
            <span className="rounded-full border border-border px-3 py-1.5 text-xs">{t.messageMaa}</span>
          </div>
        </div>
        <p className="mt-2 flex items-center justify-end gap-1 font-mono text-[12px] tracking-[0.06em] text-ink-2">
          {t.briefingTime}
          <CheckCheck className="size-3.5" strokeWidth={1.5} aria-hidden />
        </p>
      </div>
    </div>
  );
}

export function Tick({ className = "" }: { className?: string }) {
  return <Check className={`size-4 shrink-0 text-ink-2 ${className}`} strokeWidth={1.5} aria-hidden />;
}
