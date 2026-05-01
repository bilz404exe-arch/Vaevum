import React, { useState } from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "gradient" | "danger";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  onClick,
  variant = "default",
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  const isDisabled = disabled || loading;

  // Compute border color based on variant and hover state — use longhand only
  let borderColor = "rgba(255,255,255,0.1)";
  let borderWidth = "1px";
  let borderStyle: React.CSSProperties["borderStyle"] = "solid";

  if (variant === "gradient") {
    borderWidth = "0";
  } else if (variant === "danger") {
    borderColor =
      hovered && !isDisabled
        ? "rgba(255,107,157,0.6)"
        : "rgba(255,107,157,0.4)";
  } else {
    borderColor =
      hovered && !isDisabled
        ? "rgba(255,255,255,0.2)"
        : "rgba(255,255,255,0.1)";
  }

  const baseStyle: React.CSSProperties = {
    background:
      variant === "gradient"
        ? "linear-gradient(135deg, #9d8cff, #ff6b9d)"
        : "transparent",
    borderColor,
    borderWidth,
    borderStyle,
    color: variant === "danger" ? "#ff6b9d" : "#e8e6f0",
    fontFamily: '"Space Mono", monospace',
    textTransform: "uppercase",
    letterSpacing: hovered && !isDisabled ? "0.15em" : "0.1em",
    borderRadius: 0,
    padding: "10px 24px",
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "letter-spacing 0.2s ease, border-color 0.2s ease",
    opacity: isDisabled ? 0.5 : 1,
    width: fullWidth ? "100%" : undefined,
    display: "inline-block",
    fontSize: "0.875rem",
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <button
        type={type}
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={baseStyle}
      >
        {loading ? (
          <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    </>
  );
}
