import { connection } from "next/server";
import { toolAuthorized } from "@/lib/bolna/auth";
import { jsonOrLog, readJson, unauthorized } from "@/lib/http";

type Body = Record<string, unknown> & { call_sid?: string; parent_id?: string };

/**
 * One POST handler shape for every Bolna tool: bearer token, JSON body, call_sid and
 * parent_id always present, other required fields checked, errors logged not leaked.
 * Bolna may send unused params as empty strings or "None"; those count as missing.
 */
export function toolRoute<T extends { call_sid: string; parent_id: string }>(
  name: string,
  required: string[],
  handler: (body: T) => Promise<unknown>,
) {
  const handle = toolHandler(name, required, handler);
  const POST = async (req: Request) => {
    await connection();
    return handle(req);
  };
  // Tests call the same handler without a Next request scope.
  return Object.assign(POST, { handle });
}

export function toolHandler<T extends { call_sid: string; parent_id: string }>(
  name: string,
  required: string[],
  handler: (body: T) => Promise<unknown>,
) {
  return async function handle(req: Request) {
    if (!toolAuthorized(req)) return unauthorized();
    const raw = await readJson<Body>(req);
    if (!raw) return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
    const body: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value == null) continue;
      const text = String(value).trim();
      if (text === "" || text === "None" || text === "null" || /^%\(.+\)[sif]$/.test(text)) continue;
      body[key] = text;
    }
    for (const field of ["call_sid", "parent_id", ...required]) {
      if (!body[field]) return Response.json({ ok: false, error: "bad_request", missing: field }, { status: 400 });
    }
    return jsonOrLog(`tools.${name}`, { parent_id: body.parent_id, call_id: body.call_sid }, () =>
      handler(body as unknown as T),
    );
  };
}
