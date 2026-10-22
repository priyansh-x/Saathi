import type { AdminActionName } from "@/lib/admin/actions";

export function ActionForm({
  action,
  parentId,
  alertId,
  next,
  label,
  danger,
}: {
  action: AdminActionName;
  parentId?: string;
  alertId?: string;
  next: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action="/api/admin/action" method="POST" className="inline">
      <input type="hidden" name="action" value={action} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      {alertId ? <input type="hidden" name="alertId" value={alertId} /> : null}
      <input type="hidden" name="next" value={next} />
      <button type="submit" className={danger ? "btn-primary bg-alert" : "btn-secondary"}>
        {label}
      </button>
    </form>
  );
}
