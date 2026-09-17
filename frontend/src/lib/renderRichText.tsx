import type { ReactNode } from "react";

// Minimal renderer for chat text: **bold**, bullet lines starting with "•".
export function renderRichText(text: string): ReactNode[] {
  return text.split("\n").map((line, i) => {
    const parts = line
      .split(/(\*\*[^*]+\*\*)/g)
      .map((piece, j) =>
        piece.startsWith("**") && piece.endsWith("**") ? (
          <strong key={j}>{piece.slice(2, -2)}</strong>
        ) : (
          piece
        ),
      );
    return (
      <div key={i} className={line.startsWith("•") ? "chatLi" : "chatP"}>
        {parts}
      </div>
    );
  });
}
