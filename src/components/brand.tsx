import { MarkSvg } from "@/components/icons";

export function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${tone === "light" ? "text-white" : "text-foreground"}`}>
      <MarkSvg className="size-8 shrink-0" />
      <span className="text-[17px] font-semibold tracking-tight">Saathi</span>
    </span>
  );
}
