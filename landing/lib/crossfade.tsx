"use client";

export function Crossfade({
  text,
  className = "",
  lang,
}: {
  text: string;
  className?: string;
  lang?: string;
}) {
  return (
    <span className={`relative grid ${className}`}>
      <span className="invisible col-start-1 row-start-1" aria-hidden>
        {text}
      </span>
      <span key={text} className="crossfade-in col-start-1 row-start-1" lang={lang}>
        {text}
      </span>
    </span>
  );
}
