export type TrendDirection = "up" | "down" | "flat" | "dot";

interface TrendIconProps {
  direction: TrendDirection;
}

export function TrendIcon({ direction }: TrendIconProps) {
  switch (direction) {
    case "up":
      return <span className="trend trendUp">↑</span>;
    case "down":
      return <span className="trend trendDown">↓</span>;
    case "dot":
      return <span className="trend trendDot">●</span>;
    case "flat":
      return <span className="trend trendFlat">–</span>;
  }
}
