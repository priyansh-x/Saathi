import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang");
  const res = NextResponse.next();
  if (lang === "en" || lang === "hi") {
    res.cookies.set("saathi_lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}

export const config = {
  matcher: ["/d/:path*", "/demo", "/demo/:path*"],
};
