import { CHILD_WRITTEN_TEXT, CHILD_WRITTEN_VERSION } from "@/lib/consent-copy";
import { consentsFor } from "@/lib/consent";
import { nowIstStamp } from "@/lib/time";

const KIND_TEXT: Record<string, { version: string; text: string }> = {
  child_written: { version: CHILD_WRITTEN_VERSION, text: CHILD_WRITTEN_TEXT },
  parent_voice: {
    version: "parent_voice_v1",
    text: "Spoken haan on the first morning call. The child cannot say yes for her.",
  },
  neighbour_whatsapp: {
    version: "neighbour_whatsapp_v1",
    text: "Neighbour opted in on WhatsApp to receive a short alert if we cannot reach the family.",
  },
};

export async function familyConsentRecord(parentId: string) {
  const rows = await consentsFor(parentId);
  return {
    kind: "saathi_consent_record",
    exported_at: nowIstStamp(),
    parent_id: parentId,
    consents: rows.map((row) => {
      const canned = KIND_TEXT[row.kind] || { version: row.kind, text: "" };
      let version = canned.version;
      let text = canned.text;
      if (row.evidence) {
        try {
          const parsed = JSON.parse(row.evidence) as { version?: string; text?: string };
          if (parsed.version) version = parsed.version;
          if (parsed.text) text = parsed.text;
        } catch {
          /* evidence is a stamp, not the legal text */
        }
      }
      return {
        who: row.kind,
        granted: row.granted,
        at: row.at,
        text_version: version,
        text,
      };
    }),
  };
}
