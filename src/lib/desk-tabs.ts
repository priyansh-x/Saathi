export const DESK_TABS = ["today", "history", "alerts", "settings"] as const;
export type DeskTab = (typeof DESK_TABS)[number];
