export function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${tone === "light" ? "text-white" : "text-foreground"}`}>
      <span className="grid size-8 place-items-center rounded-[10px] bg-primary font-devanagari text-[17px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(142,63,29,0.8)]">
        स
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Saathi</span>
    </span>
  );
}
