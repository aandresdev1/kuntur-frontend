interface SwitchProps {
  on: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ on, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={"sw" + (on ? " swOn" : "") + (disabled ? " swDisabled" : "")}
      onClick={onChange}
    >
      <span className="swKnob" />
    </button>
  );
}
