import { cronSecret, toolToken } from "@/lib/config";

export function bearerOk(req: Request, expected: string) {
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${expected}`;
}

export function toolAuthorized(req: Request) {
  return bearerOk(req, toolToken());
}

export function cronAuthorized(req: Request) {
  return bearerOk(req, cronSecret());
}
