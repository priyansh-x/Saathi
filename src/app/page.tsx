import { DEMO_HOUSEHOLD } from "@/lib/demo-household";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16">
      <p className="text-sm text-muted-foreground">Bolna Buildathon · YC RFS · India</p>
      <div className="space-y-3">
        <h1 className="font-heading text-4xl leading-tight tracking-tight">
          Daily voice check-in
        </h1>
        <p className="text-lg text-muted-foreground">
          The agent calls the parent on a normal phone. The child gets a two-line
          briefing. The parent never installs an app.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 text-sm leading-6">
        <p className="font-medium">Build from the PRD, not from this page.</p>
        <p className="mt-2 text-muted-foreground">
          Research, requirements, and conversation rules are in <code>prd.md</code>.
          Routes to add: <code>/onboard</code>, <code>/family</code>, <code>/call</code>.
          Demo household: {DEMO_HOUSEHOLD.parentName} in {DEMO_HOUSEHOLD.city}, child{" "}
          {DEMO_HOUSEHOLD.childName}.
        </p>
      </div>
    </main>
  );
}
