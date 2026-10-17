import Link from "next/link";

export default function TokenNotFound() {
  return (
    <main className="mx-auto max-w-[480px] px-4 py-16">
      <h1 className="text-2xl font-semibold">Link expired or unknown</h1>
      <p className="mt-3 text-muted-foreground">Ask for a new WhatsApp link, or open the example desk.</p>
      <Link
        href="/d/example-kamla"
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-white"
      >
        Open example desk
      </Link>
    </main>
  );
}
