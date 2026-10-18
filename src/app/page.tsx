import Link from "next/link";
import { AddToHome } from "@/components/pwa/register";
import { productName } from "@/lib/time";

export default function Home() {
  const name = productName();
  return (
    <main className="mx-auto flex min-h-full w-full max-w-[480px] flex-col justify-center px-4 py-16">
      <p className="text-sm text-muted-foreground">{name}</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight">
        A morning call for Maa, on the phone she already has.
      </h1>
      <p className="mt-4 text-base text-muted-foreground">
        Companionship and reminders. Never diagnosis. She does not install anything.
      </p>
      <Link
        href="/onboard"
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base text-white"
      >
        Set up a call for Maa
      </Link>
      <Link
        href="/d/example-kamla"
        className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border"
      >
        Open Rohit&apos;s example desk
      </Link>
      <Link href="/demo/call" className="mt-3 inline-flex h-12 w-full items-center justify-center text-sm text-muted-foreground">
        Hear a practice call
      </Link>
      <Link href="/demo/controls" className="mt-2 inline-flex h-12 w-full items-center justify-center text-sm text-muted-foreground">
        Run the two-minute EXAMPLE walks
      </Link>
      <AddToHome lang="en" />
    </main>
  );
}
