import type { SVGProps } from "react";
import { MARK_GLYPH, MARK_PATH, MARK_TILE } from "@/lib/brand";

export function MarkSvg({ className, title = "Saathi" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label={title}>
      <rect width="512" height="512" rx="112" fill={MARK_TILE} />
      <path fill={MARK_GLYPH} d={MARK_PATH} />
    </svg>
  );
}

export function MarkGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden {...props}>
      <path fill="currentColor" d={MARK_PATH} />
    </svg>
  );
}
