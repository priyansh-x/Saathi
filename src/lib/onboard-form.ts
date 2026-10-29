import { z } from "zod";
import { CHILD_WRITTEN_TEXT, CHILD_WRITTEN_VERSION } from "@/lib/consent-copy";
import { toE164 } from "@/lib/phone";
import type { Language } from "@/lib/types";

export const ADDRESS_TERMS = [
  "Maa",
  "Papa",
  "Amma",
  "Aai",
  "Mumma",
  "Nani",
  "Nana",
  "Appa",
  "Dadi",
  "Dada",
] as const;

export const CALL_TIMES = ["07:00", "08:00", "08:30", "09:00", "10:00"] as const;

export const LANGUAGE_OPTIONS: { label: Language; code: string }[] = [
  { label: "Hindi", code: "hi" },
  { label: "English", code: "en" },
  { label: "Marathi", code: "mr" },
  { label: "Tamil", code: "ta" },
  { label: "Kannada", code: "kn" },
];

const e164 = z.string().transform((value, ctx) => {
  const phone = toE164(value);
  if (!phone) {
    ctx.addIssue({ code: "custom", message: "Use a 10-digit Indian mobile, or +91 then 10 digits." });
    return z.NEVER;
  }
  return phone;
});

const medicineSchema = z.object({
  name: z.string().trim().min(1, "Name the tablet the way they say it."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time for this tablet."),
  withFood: z.boolean(),
});

export const onboardSchema = z
  .object({
    childName: z.string().trim().min(1, "Add your name. The briefing comes to you."),
    childWhatsapp: e164,
    parentName: z.string().trim().min(1, "Add your parent's name."),
    addressTerm: z.string().trim().min(1, "Tell us what you call them."),
    parentPhone: e164,
    city: z.string().trim().min(1, "Add their city."),
    languages: z.array(z.string().min(1)).min(1, "Pick at least one language for the call."),
    callTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a morning call time."),
    medicines: z.array(medicineSchema),
    neighborName: z.string(),
    neighborPhone: z.string(),
    toldParent: z.boolean().refine((v) => v, {
      message: "The first call must not be a surprise. Tell them first, then tick the box.",
    }),
  })
  .superRefine((value, ctx) => {
    const name = value.neighborName.trim();
    const phone = value.neighborPhone.trim();
    if (name && !toE164(phone)) {
      ctx.addIssue({
        code: "custom",
        path: ["neighborPhone"],
        message: "Add a 10-digit number for the neighbour, or skip that step.",
      });
    }
    if (phone && !name) {
      ctx.addIssue({
        code: "custom",
        path: ["neighborName"],
        message: "Add the neighbour's name, or skip that step.",
      });
    }
  });

export type OnboardInput = z.input<typeof onboardSchema>;
export type OnboardParsed = z.output<typeof onboardSchema>;
export type ParsedMedicine = z.infer<typeof medicineSchema>;

export function parseOnboard(input: unknown) {
  const result = onboardSchema.safeParse(input);
  if (result.success) return { ok: true as const, data: result.data };
  const message = result.error.issues[0]?.message || "Check the form and try again.";
  return { ok: false as const, error: message };
}

export function languageCodes(codes: string[]) {
  const unique = [...new Set(codes.map((c) => c.trim().toLowerCase()).filter(Boolean))];
  if (!unique.includes("en")) unique.push("en");
  return unique.join(",");
}

export { CHILD_WRITTEN_TEXT, CHILD_WRITTEN_VERSION };
