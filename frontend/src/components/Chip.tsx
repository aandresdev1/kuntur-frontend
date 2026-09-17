import type { ReactNode } from "react";
import { theme } from "@/lib/theme";

export type ChipTone = "pen" | "green" | "amber" | "red" | "neutral";

interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
}

const TONES: Record<ChipTone, { bg: string; fg: string }> = {
  pen: { bg: theme.penSoft, fg: theme.pen },
  green: { bg: theme.greenSoft, fg: theme.green },
  amber: { bg: theme.amberSoft, fg: theme.amber },
  red: { bg: "#FDECEC", fg: theme.margin },
  neutral: { bg: "#F1F0EA", fg: theme.inkSoft },
};

export function Chip({ children, tone = "pen" }: ChipProps) {
  const t = TONES[tone];
  return (
    <span className="chip" style={{ background: t.bg, color: t.fg }}>
      {children}
    </span>
  );
}
