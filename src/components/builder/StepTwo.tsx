import React from "react";
import OptionGrid from "./OptionGrid";

interface StepTwoProps {
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

const ROLE_OPTIONS = [
  { value: "Girlfriend", label: "Girlfriend", emoji: "💕" },
  { value: "Boyfriend", label: "Boyfriend", emoji: "💙" },
  { value: "Best Friend", label: "Best Friend", emoji: "🤝" },
  { value: "Therapist", label: "Therapist", emoji: "🧠" },
  { value: "Dominant", label: "Dominant", emoji: "👑" },
  { value: "Submissive", label: "Submissive", emoji: "🌸" },
  { value: "Protector", label: "Protector", emoji: "🛡️" },
  { value: "Villain", label: "Villain", emoji: "🖤" },
  { value: "Mentor", label: "Mentor", emoji: "🔮" },
  { value: "Custom", label: "Custom", emoji: "✨" },
];

export default function StepTwo({ value, onChange }: StepTwoProps) {
  return (
    <div>
      <div style={labelStyle}>02 — Role</div>
      <OptionGrid
        options={ROLE_OPTIONS}
        selected={value}
        onSelect={onChange}
        columns={1}
      />
    </div>
  );
}
