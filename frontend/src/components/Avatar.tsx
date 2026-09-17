interface AvatarProps {
  full_name: string;
  size?: number;
}

const PALETTE = ["#2F5FE3", "#2E9E6B", "#C77E14", "#8B5CF6", "#0E9AA7"];

export function Avatar({ full_name, size = 40 }: AvatarProps) {
  const initials = full_name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("");
  const color = PALETTE[full_name.length % PALETTE.length]!;
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: color + "1A",
        color,
      }}
    >
      {initials}
    </div>
  );
}
