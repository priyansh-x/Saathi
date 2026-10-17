export type StatusLevel = "good" | "look" | "act";

export type DoseStatus = "taken" | "not_taken" | "not_sure" | "not_asked";

export type Parent = {
  id: string;
  full_name: string;
  first_name: string;
  city: string;
  timezone: string;
  phone: string;
  languages: string;
  call_time: string;
  paused: boolean;
  recording_consent: boolean;
  is_example: boolean;
};

export type Contact = {
  id: string;
  parent_id: string;
  role: "child" | "neighbour";
  full_name: string;
  first_name: string;
  phone: string;
  locale: string;
  email: string | null;
};

export type Medicine = {
  id: string;
  name: string;
  dose: string;
  appearance: string;
  meal: string;
};

export type CallRow = {
  id: string;
  parent_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  status: "completed" | "missed" | "no_conversation" | "in_progress";
  summary_en: string | null;
  summary_hi: string | null;
  mood_quote: string | null;
  mood_quote_lang: string | null;
  mood?: "cheerful" | "okay" | "low" | "unclear" | null;
  transcript_json: string | null;
};

export type DoseLog = {
  id: string;
  medicine_id: string;
  schedule_date: string;
  status: DoseStatus;
  said: string | null;
  name?: string;
  dose?: string;
  meal?: string;
};

export type AlertRow = {
  id: string;
  parent_id: string;
  call_id: string | null;
  category: string;
  level: StatusLevel;
  quote: string;
  created_at: string;
  acked_at: string | null;
  acked_by: string | null;
  resolved_at: string | null;
  late: boolean;
  source: string;
  is_false?: boolean;
};

export type AttemptRow = {
  id: string;
  attempted_at: string;
  offset_min: number;
  result: string;
};

export type AlertEvent = {
  id: string;
  at: string;
  kind: string;
  actor: string | null;
  note: string | null;
};
