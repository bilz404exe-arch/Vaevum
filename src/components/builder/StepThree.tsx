import React from "react";
import OptionGrid from "./OptionGrid";

interface StepThreeProps {
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

const GENDER_OPTIONS = [
  { value: "Feminine", label: "Feminine ♀", emoji: "♀" },
  { value: "Masculine", label: "Masculine ♂", emoji: "♂" },
  { value: "Non-binary", label: "Non-binary ◈", emoji: "◈" },
  { value: "Fluid", label: "Fluid ∞", emoji: "∞" },
];

export default function StepThree({ value, onChange }: StepThreeProps) {
  return (
    <div>
      <div style={labelStyle}>03 — Gender Energy</div>
      <OptionGrid
        options={GENDER_OPTIONS}
        selected={value}
        onSelect={onChange}
        columns={1}
      />
    </div>
  );
}
