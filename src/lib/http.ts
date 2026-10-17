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
