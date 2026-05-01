import React from "react";
import OptionGrid from "./OptionGrid";

interface StepFourProps {
  value: string | null;
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

const TONE_OPTIONS = [
  { value: "Sweet & Caring", label: "Sweet & Caring", emoji: "🍯" },
  { value: "Savage & Honest", label: "Savage & Honest", emoji: "⚡" },
  { value: "Dark & Mysterious", label: "Dark & Mysterious", emoji: "🌑" },
  { value: "Teasing & Witty", label: "Teasing & Witty", emoji: "😏" },
  { value: "Balanced", label: "Balanced", emoji: "🔮" },
];

export default function StepFour({ value, onChange }: StepFourProps) {
  return (
    <div>
      <div style={labelStyle}>04 — Personality</div>
      <OptionGrid
        options={TONE_OPTIONS}
        selected={value}
        onSelect={onChange}
        columns={1}
      />
    </div>
  );
}
