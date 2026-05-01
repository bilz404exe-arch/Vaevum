import React from "react";

interface StepOneProps {
  value: string;
  onChange: (value: string) => void;
}

const labelStyle: React.CSSProperties = {
  fontFamily: '"Space Mono", monospace',
  fontSize: "0.65rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#6b6880",
  marginBottom: "16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 0,
  color: "#e8e6f0",
  fontFamily: '"Cormorant Garamond", serif',
  fontStyle: "italic",
  fontSize: "1.5rem",
  padding: "8px 0",
  outline: "none",
  boxSizing: "border-box",
};

const charCountStyle: React.CSSProperties = {
  fontFamily: '"Space Mono", monospace',
  fontSize: "0.65rem",
  color: "#6b6880",
  marginTop: "8px",
  textAlign: "right",
};

export default function StepOne({ value, onChange }: StepOneProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 24) {
      onChange(e.target.value);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderBottomColor = "rgba(157,140,255,0.6)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderBottomColor = "rgba(255,255,255,0.1)";
  };

  return (
    <div>
      <div style={labelStyle}>01 — Name</div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Name your Vaevum..."
        maxLength={24}
        style={inputStyle}
        aria-label="Persona name"
      />
      <div style={charCountStyle}>{value.length}/24</div>
    </div>
  );
}
