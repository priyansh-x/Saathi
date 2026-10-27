import { MONTH_EN, MONTH_HI } from "@/lib/time";
import type { Lang } from "@/lib/i18n/messages";

export const ERRAND_FOLLOWUP_HI = "आपकी दवाई पहुँच गई?";
export const ERRAND_FOLLOWUP_EN = "Has your medicine arrived?";

export const PHARMACY_COPY = {
  en: {
    title: "Saathi Pharmacy (demo)",
    place: "Place order",
    demo: "Demo partner, no real order placed",
    medicine: "Medicine",
    quantity: "Quantity (strips)",
    strip: "strip",
    strips: "strips",
    delivery: "Delivery",
    tomorrow: "Tomorrow (IST)",
    placed: "Order noted",
    fakeId: "Fake order id",
    back: "Back to the desk",
    paused: "Orders are paused.",
    noPay: "Saathi never takes payment and never handles prescriptions.",
  },
  hi: {
    title: "Saathi फ़ार्मेसी (डेमो)",
    place: "ऑर्डर करें",
    demo: "डेमो पार्टनर, कोई असली ऑर्डर नहीं",
    medicine: "दवा",
    quantity: "मात्रा (पट्टियाँ)",
    strip: "पट्टी",
    strips: "पट्टियाँ",
    delivery: "डिलीवरी",
    tomorrow: "कल (IST)",
    placed: "ऑर्डर दर्ज",
    fakeId: "नकली ऑर्डर आईडी",
    back: "डेस्क पर वापस",
    paused: "ऑर्डर रुक गए हैं।",
    noPay: "साथी पैसे नहीं लेता और पर्चा नहीं संभालता।",
  },
} as const;

export const ERRAND_DESK_COPY = {
  en: {
    heading: "Refill",
    runningLow: "running low",
    place: "Place order",
    demo: "Demo partner, no real order placed",
    ordered: "Ordered",
    out: "Out for delivery",
    delivered: "Delivered",
    orderId: "Order",
  },
  hi: {
    heading: "रिफिल",
    runningLow: "कम पड़ रही है",
    place: "ऑर्डर करें",
    demo: "डेमो पार्टनर, कोई असली ऑर्डर नहीं",
    ordered: "ऑर्डर हुआ",
    out: "डिलीवरी पर",
    delivered: "पहुँच गई",
    orderId: "ऑर्डर",
  },
} as const;

export function formatDeliveryDay(day: string, lang: Lang) {
  const [, m, d] = day.split("-").map((n) => Number(n));
  const month = lang === "hi" ? MONTH_HI[(m || 1) - 1] : MONTH_EN[(m || 1) - 1];
  return `${d} ${month}`;
}

export function pharmacyPageText() {
  return [
    ...Object.values(PHARMACY_COPY.en),
    ...Object.values(PHARMACY_COPY.hi),
    ...Object.values(ERRAND_DESK_COPY.en),
    ...Object.values(ERRAND_DESK_COPY.hi),
    ERRAND_FOLLOWUP_HI,
    ERRAND_FOLLOWUP_EN,
  ].join("\n");
}
