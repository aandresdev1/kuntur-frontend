import { theme } from "@/lib/theme";

interface MockBadgeProps {
  title?: string;
}

// Marker used across the UI to make it obvious which values come from local
// mock data instead of the backend. Kept intentionally tiny so it can sit
// inline next to labels, columns, or card headers.
export function MockBadge({
  title = "Dato mock — aún no proviene del backend",
}: MockBadgeProps) {
  return (
    <span
      className="mockBadge"
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        marginLeft: 6,
        padding: "1px 6px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        background: "#FDECEC",
        color: theme.margin,
        border: `1px dashed ${theme.margin}`,
        verticalAlign: "middle",
      }}
    >
      mock
    </span>
  );
}
