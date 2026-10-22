export default function CallLoading() {
  return (
    <main className="app-shell">
      <div className="app-shell-scroll px-4 pt-3 pb-8" aria-busy>
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        <div className="mt-6 h-4 w-40 animate-pulse rounded-full bg-muted" />
        <div className="mt-5 h-28 animate-pulse rounded-[22px] bg-card" />
        <div className="mt-4 h-40 animate-pulse rounded-[22px] bg-card" />
      </div>
    </main>
  );
}
