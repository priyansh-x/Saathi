/** Family desk origin. Read env; never put this URL in marketing copy. */
const DEFAULT_FAMILY_DESK_URL = "https://x-navy-tau.vercel.app";

export function familyDeskUrl() {
  const raw =
    process.env.FAMILY_DESK_URL || process.env.NEXT_PUBLIC_FAMILY_DESK_URL || DEFAULT_FAMILY_DESK_URL;
  return raw.replace(/\/$/, "");
}

export function exampleDeskUrl() {
  return `${familyDeskUrl()}/d/example-kamla`;
}
