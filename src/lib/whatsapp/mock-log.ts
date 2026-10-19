export type MockLoggedWhatsapp = {
  name: string;
  language: "en" | "hi";
  vars: string[];
  buttons: number;
};

/** Test helper. Production send.ts records mock Graph payloads here when MOCK_WHATSAPP=1. */
export const mockLoggedWhatsapp: MockLoggedWhatsapp[] = [];
