import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Saathi",
  robots: { index: false, follow: false },
};

export default function LandingAdminPage() {
  const desk = (process.env.FAMILY_DESK_URL || process.env.NEXT_PUBLIC_FAMILY_DESK_URL || "").replace(/\/$/, "");
  const href = desk ? `${desk}/admin` : "";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
      <p className="text-xs font-semibold tracking-wide uppercase opacity-60">Internal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin is on the family desk</h1>
      <p className="mt-3 text-sm leading-6 opacity-80">
        Households, transcripts, alerts, and actions live on the family app. This marketing site has no family
        database. Open <code>/admin</code> on the desk host. Password is <code>ADMIN_PASSWORD</code>; ops emails can
        skip it after sign-in.
      </p>
      {href ? (
        <a href={href} className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white">
          Open family admin
        </a>
      ) : (
        <p className="mt-8 text-sm opacity-70">Set FAMILY_DESK_URL on this host if you want a one-tap link here.</p>
      )}
    </main>
  );
}
