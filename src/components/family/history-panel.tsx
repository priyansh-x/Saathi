import { HistoryView } from "@/components/family/history-view";
import { clientSafe } from "@/lib/client-safe";
import { historyDays, medicinesFor } from "@/lib/db/queries";
import type { FamilyDesk } from "@/lib/family-load";
import type { Lang } from "@/lib/i18n/messages";

export async function HistoryPanel({
  token,
  lang,
  data,
  view,
}: {
  token: string;
  lang: Lang;
  data: FamilyDesk;
  view: "calendar" | "list";
}) {
  const hist = await historyDays(data.parent.id, 80);
  const medicines = await medicinesFor(data.parent.id);
  return (
    <HistoryView
      token={token}
      lang={lang}
      initialMode={view}
      calls={clientSafe(hist.calls)}
      doses={clientSafe(hist.doses)}
      alerts={clientSafe(hist.alerts)}
      medicineIds={medicines.map((m) => m.id)}
    />
  );
}
