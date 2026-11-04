import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang");
  if (lang !== "en" && lang !== "hi") return NextResponse.next();
  // Mirror the choice onto this request too, so the first render already uses it.
  req.cookies.set("saathi_lang", lang);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set("saathi_lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|images|icons|manifest).*)"],
};
