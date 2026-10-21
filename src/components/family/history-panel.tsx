import { HistoryView } from "@/components/family/history-view";
import { clientSafe } from "@/lib/client-safe";
import { syncDeskFromBolna } from "@/lib/bolna/execution";
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
  await syncDeskFromBolna(data.parent, data.call);
  const hist = await historyDays(data.parent.id, 80);
  const medicines = await medicinesFor(data.parent.id);
  return (
    <HistoryView
      token={token}
      lang={lang}
      initialDays={days}
      calls={clientSafe(hist.calls)}
      doses={clientSafe(hist.doses)}
      alerts={clientSafe(hist.alerts)}
      medicineIds={medicines.map((m) => m.id)}
    />
  );
}
