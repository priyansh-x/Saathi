export default function AlertLoading() {
  return (
    <main className="app-shell">
      <div className="app-shell-scroll px-4 pt-3 pb-8" aria-busy>
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        <div className="mt-6 h-8 w-56 animate-pulse rounded-full bg-muted" />
        <div className="mt-5 h-24 animate-pulse rounded-[22px] bg-card" />
        <div className="mt-4 h-12 animate-pulse rounded-full bg-muted" />
      </div>
    </main>
  );
}
