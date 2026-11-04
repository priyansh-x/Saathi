"use client";

import { useRef, useState } from "react";

/** Native POST; disable after the first tap so a double click is one request. */
export function TestCallForm({
  action,
  children,
}: {
  action: string;
  children: React.ReactNode;
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
      <button type="submit" className="btn-primary disabled:opacity-60" disabled={pending}>
        {children}
      </button>
    </form>
  );
}
