"use client";

import { useRef, useState } from "react";

/** Native POST; disable after the first tap so a double click is one request. */
export function TestCallForm({
  action,
  children,
  variant = "primary",
}: {
  action: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  return (
    <form
      action={action}
      method="POST"
      onSubmit={(event) => {
        if (locked.current) {
          event.preventDefault();
          return;
        }
        locked.current = true;
        setPending(true);
      }}
    >
      <button type="submit" className={variant === "primary" ? "btn-primary" : "btn-secondary"} disabled={pending}>
        {children}
      </button>
    </form>
  );
}
