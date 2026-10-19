import { isMockWhatsapp } from "@/lib/config";

export type MockLoggedWhatsapp = {
  name: string;
  language: "en" | "hi";
  vars: string[];
  buttons: number;
};

/** Test helper. send.ts records mock Graph payloads here only while MOCK_WHATSAPP=1. */
export const mockLoggedWhatsapp: MockLoggedWhatsapp[] = [];

const MOCK_LOG_CAP = 200;

export function recordMockWhatsapp(entry: MockLoggedWhatsapp) {
  if (!isMockWhatsapp()) return;
  mockLoggedWhatsapp.push(entry);
  while (mockLoggedWhatsapp.length > MOCK_LOG_CAP) mockLoggedWhatsapp.shift();
}
