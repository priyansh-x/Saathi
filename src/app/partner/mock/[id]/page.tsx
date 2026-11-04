import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MarkSvg } from "@/components/icons";
import { EXAMPLE_TOKEN, killSwitchOn } from "@/lib/config";
import { readLang } from "@/lib/family-load";
import { titled } from "@/lib/page-title";
import { formatDeliveryDay, PHARMACY_COPY } from "@/lib/partners/copy";
import { errandById, placeMockOrder, syncMockErrand } from "@/lib/partners/errands";
import { clampStrips } from "@/lib/partners/mock";
import { istDayOffset } from "@/lib/time";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  return titled("Saathi Pharmacy (demo)", "Saathi फ़ार्मेसी (डेमो)", (await searchParams).lang);
}

export default async function MockPharmacyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; token?: string; record?: string; error?: string; placed?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const lang = readLang(q.lang);
  const t = PHARMACY_COPY[lang];
  const loaded = await errandById(id);
  if (!loaded) notFound();
  const errand = await syncMockErrand(loaded);
  const desk = q.token || errand.desk_token || EXAMPLE_TOKEN;
  const record = q.record === "1" ? "&record=1" : "";
  const deliveryDay = errand.delivery_day || istDayOffset(1);
  const qs = `lang=${lang}&token=${encodeURIComponent(desk)}${record}`;
  const paused = q.error === "kill" || killSwitchOn();

  async function place(formData: FormData) {
    "use server";
    const quantity = clampStrips(formData.get("quantity"));
    const result = await placeMockOrder(id, { quantity });
    const next = `/partner/mock/${encodeURIComponent(id)}?lang=${lang}&token=${encodeURIComponent(desk)}${q.record === "1" ? "&record=1" : ""}`;
    if (!result.ok) redirect(`${next}&error=kill`);
    redirect(`${next}&placed=1`);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] px-4 py-8" style={{ background: "#F7F5F0", color: "#1D1B18" }}>
      <p className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
        <MarkSvg className="size-8 shrink-0" title="Saathi" />
        {t.title}
      </p>
      <p className="mt-3 text-[13px] leading-5 text-[#5c534a]">{t.demo}</p>
      <p className="mt-1 text-[13px] leading-5 text-[#5c534a]">{t.noPay}</p>

      {errand.partner_order_id ? (
        <section className="card mt-8 p-5">
          <p className="text-lg font-semibold">{t.placed}</p>
          <p className="mt-2 text-[15px]">
            {t.fakeId}: {errand.partner_order_id}
          </p>
          <p className="mt-4 text-[13px] text-[#5c534a]">{t.demo}</p>
          <Link href={`/d/${desk}?lang=${lang}`} className="btn-primary mt-6">
            {t.back}
          </Link>
        </section>
      ) : (
        <form action={place} className="card mt-8 space-y-4 p-5">
          <p>
            <span className="section-label">{t.medicine}</span>
            <span className="mt-1 block text-[18px] font-medium">{errand.medicine_name}</span>
          </p>
          <label className="block">
            <span className="section-label">{t.quantity}</span>
            <select
              name="quantity"
              defaultValue={String(clampStrips(errand.quantity))}
              className="mt-1 w-full rounded-2xl border border-border bg-white px-3 py-3 text-[16px]"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? t.strip : t.strips}
                </option>
              ))}
            </select>
          </label>
          <p>
            <span className="section-label">{t.delivery}</span>
            <span className="mt-1 block text-[16px]">
              {t.tomorrow} · {formatDeliveryDay(deliveryDay, lang)}
            </span>
          </p>
          {paused ? <p className="text-[15px] text-alert">{t.paused}</p> : null}
          <button type="submit" className="btn-primary" disabled={paused}>
            {t.place}
          </button>
          <p className="text-[12px] leading-5 text-[#5c534a]">{t.demo}</p>
        </form>
      )}
      <p className="mt-6 text-center text-[12px]">
        <Link href={`/d/${desk}?${qs}`} className="text-primary underline-offset-2 hover:underline">
          {t.back}
        </Link>
      </p>
    </main>
  );
}
