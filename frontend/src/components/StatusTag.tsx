export type StatusTagTone = "ok" | "trial" | "off";

interface StatusTagProps {
  tone: StatusTagTone;
  label: string;
}

const CLASS_BY_TONE: Record<StatusTagTone, string> = {
  ok: "estOk",
  trial: "estTrial",
  off: "estOff",
};

// Presentational atom — mapping enum values (SchoolStatus, subscription plan, etc.)
// to a tone/label happens in the caller.
export function StatusTag({ tone, label }: StatusTagProps) {
  return <span className={"estTag " + CLASS_BY_TONE[tone]}>{label}</span>;
}
