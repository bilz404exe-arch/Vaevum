import React, { useState } from "react";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "email";
  error?: string;
  disabled?: boolean;
  fontStyle?: "mono" | "serif";
  label?: string;
  id?: string;
}

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled = false,
  fontStyle = "mono",
  label,
  id,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const inputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: focused
      ? "1px solid rgba(157,140,255,0.6)"
      : error
        ? "1px solid rgba(255,107,157,0.6)"
        : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 0,
    color: "#e8e6f0",
    fontFamily:
      fontStyle === "serif"
        ? '"Cormorant Garamond", serif'
        : '"Space Mono", monospace',
    fontSize: fontStyle === "serif" ? "1rem" : "0.875rem",
    padding: "8px 0",
    width: "100%",
    outline: "none",
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "text",
    transition: "border-bottom-color 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6b6880",
    marginBottom: "4px",
  };

  const errorStyle: React.CSSProperties = {
    color: "#ff6b9d",
    fontSize: "0.75rem",
    fontFamily: '"Space Mono", monospace',
    marginTop: "4px",
    display: "block",
  };

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
