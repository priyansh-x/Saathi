import type { SVGProps } from "react";

function Ico(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

export function IconCall(p: SVGProps<SVGSVGElement>) {
  return (
    <Ico {...p}>
      <path d="M7.2 3.8c.4-.6 1.3-.8 1.9-.4l2 1.3c.6.4.8 1.2.5 1.9l-.9 2.1c-.2.5 0 1.1.4 1.4 1.2 1 2.5 2.2 3.6 3.4.4.4 1 .6 1.5.4l2.1-.8c.7-.3 1.5 0 1.9.5l1.4 2c.4.7.2 1.5-.4 1.9-1.4.9-3.2 1.5-5 .2-3.3-2.4-6.6-5.8-8.8-9.3-1.2-1.9-.4-3.6.8-5.2Z" />
    </Ico>
  );
}

export function IconMedicine(p: SVGProps<SVGSVGElement>) {
  return (
    <Ico {...p}>
      <rect x="8" y="3.5" width="8" height="17" rx="4" />
      <path d="M8 12h8" />
    </Ico>
  );
}

export function IconAlert(p: SVGProps<SVGSVGElement>) {
  return (
    <Ico {...p}>
      <path d="M12 4.2 3.8 18.6h16.4L12 4.2Z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="16.6" r="0.7" fill="currentColor" stroke="none" />
    </Ico>
  );
}

export function IconNeighbour(p: SVGProps<SVGSVGElement>) {
  return (
    <Ico {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.8 18.5c.6-2.8 2.6-4.3 5.2-4.3s4.6 1.5 5.2 4.3" />
      <circle cx="16.5" cy="9" r="2.2" />
      <path d="M15.2 14.4c1.8.2 3.2 1.3 3.8 3.4" />
    </Ico>
  );
}

export function IconFamily(p: SVGProps<SVGSVGElement>) {
  return (
    <Ico {...p}>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M6 19c.7-3.2 2.8-5 6-5s5.3 1.8 6 5" />
    </Ico>
  );
}

export function IconSettings(p: SVGProps<SVGSVGElement>) {
  return (
    <Ico {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.6v1.8M12 18.6v1.8M20.4 12h-1.8M5.4 12H3.6M17.9 6.1l-1.3 1.3M7.4 16.6l-1.3 1.3M17.9 17.9l-1.3-1.3M7.4 7.4 6.1 6.1" />
    </Ico>
  );
}

export function IconHistory(p: SVGProps<SVGSVGElement>) {
  return (
    <Ico {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.2V12l2.6 1.6" />
    </Ico>
  );
}

export function MarkSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#34507A" />
      <path fill="none" stroke="#F7F5F0" strokeWidth="5.5" strokeLinecap="round" d="M46.8 20.4a18 18 0 1 0 1.2 8.2" />
      <circle cx="32" cy="32" r="6.2" fill="#F7F5F0" />
    </svg>
  );
}
