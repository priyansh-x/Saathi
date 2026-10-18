import { logError } from "@/lib/log-error";

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function jsonOrLog(
  where: string,
  context: Record<string, unknown>,
  fn: () => Promise<unknown>,
) {
  try {
    return Response.json(await fn());
  } catch (err) {
    await logError(where, err, context);
    return Response.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
