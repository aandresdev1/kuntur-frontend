interface MicButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label?: string;
}

export function MicButton({
  onClick,
  active = false,
  disabled = false,
  label = "Dictar por voz",
}: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={"micBtn" + (active ? " micBtnOn" : "")}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z"
        />
      </svg>
    </button>
  );
}
