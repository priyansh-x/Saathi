import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
        <p className="text-sm text-muted-foreground">India · phone-first · family-paid</p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.15] tracking-tight sm:text-5xl">
          A voice that calls your parents every morning, on the phone they already have.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          They answer like any other call. You get two lines on WhatsApp: they woke,
          they took the tablet, they are fine — or they are not. If they miss the
          ring, a neighbour is asked to knock.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/onboard" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}>
            Set up a household
          </Link>
          <Link
            href="/call"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5")}
          >
            Hear a demo call
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3">
          <Stat n="157 million" d="Indians over 60 today. 193 million by 2030." />
          <Stat n="27%" d="already live without children in the house — alone or only with a spouse." />
          <Stat n="1 in 4" d="hypertensives are not taking the tablet. Living alone makes control worse." />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">The parent never installs an app</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Alexa already fails older people in English-speaking houses. In Coimbatore
            or Lucknow the failure is sharper: a keypad phone, Hindi, no patience for
            QR codes. The only interface they will complete is a ringing phone with
            your name attached.
          </p>
        </div>
        <div>
          <h2 className="font-heading text-2xl tracking-tight">You are the buyer. Silence is the risk.</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Agencies sell attendants and panic buttons for loud days. The day you
            actually fear is quiet: no answer after tea, tablet skipped, knee too
            swollen to reach the kitchen. This product is that Tuesday, every day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="font-heading text-2xl tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-4">
          <Step n="1" t="You set it up" d="Parent’s number, language, tablets, one neighbour who can walk over." />
          <Step n="2" t="The agent calls" d="After breakfast. Slow Hindi. Your name in the first sentence." />
          <Step n="3" t="They just talk" d="Sleep, the white tablet, dizziness, is anyone coming today." />
          <Step n="4" t="You get two lines" d="OK, Watch, Emergency, or Missed. Never an empty morning." />
        </ol>
        <p className="mt-8 text-sm text-muted-foreground">
          Demo household is fictional: Kamala Iyer in Coimbatore, child Ananya. Do
          not point this at a real parent without their consent.
        </p>
      </section>
    </main>
  );
}

function Stat({ n, d }: { n: string; d: string }) {
  return (
    <div>
      <p className="font-heading text-3xl tracking-tight">{n}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
    </div>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">0{n}</p>
      <p className="mt-2 font-medium">{t}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{d}</p>
    </li>
  );
}
