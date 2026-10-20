import { HistoryView } from "@/components/family/history-view";
import { historyDays, medicinesFor } from "@/lib/db/queries";
import type { FamilyDesk } from "@/lib/family-load";
import type { Lang } from "@/lib/i18n/messages";

export async function HistoryPanel({
  token,
  lang,
  data,
  days,
}: {
  token: string;
  lang: Lang;
  data: FamilyDesk;
  days: 7 | 30;
}) {
  const hist = await historyDays(data.parent.id, 40);
  const medicines = await medicinesFor(data.parent.id);
  return (
    <HistoryView
      token={token}
      lang={lang}
      initialDays={days}
      calls={hist.calls}
      doses={hist.doses}
      alerts={hist.alerts}
      medicineIds={medicines.map((m) => m.id)}
    />
  );
}
