import Link from "next/link";
import { Check } from "lucide-react";
import { IconMedicine } from "@/components/icons";
import type { ErrandRow } from "@/lib/db/types";
import type { Lang } from "@/lib/i18n/messages";
import { ERRAND_DESK_COPY } from "@/lib/partners/copy";
import { mockTimeline } from "@/lib/partners/mock";

export function ErrandCard({ token, lang, errand }: { token: string; lang: Lang; errand: ErrandRow }) {
  const t = ERRAND_DESK_COPY[lang];
  const href = `/partner/mock/${encodeURIComponent(errand.id)}?lang=${lang}&token=${encodeURIComponent(token)}`;
  const steps = mockTimeline(errand);
  const labels = { ordered: t.ordered, out_for_delivery: t.out, delivered: t.delivered };

  return (
    <li className="card mt-2 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep">
          <IconMedicine className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-medium">{errand.medicine_name}</p>
          <p className="text-[13px] text-ink-3">
            {errand.medicine_name} {t.runningLow}
            {errand.partner_order_id ? ` · ${t.orderId} ${errand.partner_order_id}` : ""}
          </p>
          {errand.status === "open" ? (
            <Link href={href} className="btn-primary mt-3">
              {t.place}
            </Link>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {steps.map((step) => (
                <li key={step.key} className="flex items-center gap-2 text-[13px]">
                  <span
                    className={`grid size-5 place-items-center rounded-full ${
                      step.done ? "bg-good text-white" : "border border-current/30 text-ink-3"
                    }`}
                  >
                    {step.done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
                  </span>
                  <span className={step.done ? "text-foreground" : "text-ink-3"}>{labels[step.key]}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-[12px] leading-5 text-ink-3">{t.demo}</p>
        </div>
      </div>
    </li>
  );
}
