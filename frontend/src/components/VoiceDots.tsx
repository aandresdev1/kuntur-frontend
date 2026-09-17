import type { ReactNode } from "react";

interface VoiceDotsProps {
  children: ReactNode;
}

// Reuses the animated dots from the chat component to signal "listening" state.
export function VoiceDots({ children }: VoiceDotsProps) {
  return (
    <div className="voiceThinking">
      <span className="chatDots" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
      </span>
      <span>{children}</span>
    </div>
  );
}
