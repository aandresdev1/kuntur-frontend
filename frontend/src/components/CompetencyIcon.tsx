import { theme } from "@/lib/theme";

// Tone is decoupled from the competency name — resolvers live in the data layer.
export type CompetencyTone = "pen" | "green" | "amber";

interface CompetencyIconProps {
  tone?: CompetencyTone;
}

const TONES: Record<CompetencyTone, [bg: string, fg: string]> = {
  pen: [theme.penSoft, theme.pen],
  green: [theme.greenSoft, theme.green],
  amber: [theme.amberSoft, theme.amber],
};

export function CompetencyIcon({ tone = "pen" }: CompetencyIconProps) {
  const [bg, fg] = TONES[tone];
  return (
    <span className="obsIco" style={{ background: bg, color: fg }}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    </span>
  );
}
