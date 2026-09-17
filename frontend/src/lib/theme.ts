export const theme = {
  paper: "#FBFAF6",
  paperCard: "#FFFFFF",
  ink: "#1C2B4A",
  inkSoft: "#5A6784",
  pen: "#2F5FE3",
  penSoft: "#EAF0FF",
  margin: "#E5484D",
  highlighter: "#FFE066",
  green: "#2E9E6B",
  greenSoft: "#E6F5EE",
  amber: "#C77E14",
  amberSoft: "#FDF3E1",
  line: "#E7E5DC",
  navy: "#131C36",
  navyLight: "#1E2A4A",
  navyText: "#9AA6C4",
} as const;

export type Theme = typeof theme;
