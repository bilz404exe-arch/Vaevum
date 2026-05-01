import React from "react";
import OptionGrid from "./OptionGrid";

interface StepFiveProps {
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

const MODE_OPTIONS = [
  {
    value: "💬 Default",
    label: "Default",
    emoji: "💬",
    description: "Unfiltered, real conversation",
  },
  {
    value: "🌶️ Spicy",
    label: "Spicy",
    emoji: "🌶️",
    description: "Flirty and teasing tension",
  },
  {
    value: "🖤 Dark",
    label: "Dark",
    emoji: "🖤",
    description: "Into the darkness together",
  },
  {
    value: "🕯️ Erotic",
    label: "Erotic",
    emoji: "🕯️",
    description: "Sensual slow-burn energy",
  },
  {
    value: "😤 Grievance",
    label: "Grievance",
    emoji: "😤",
    description: "Absorb and validate rage",
  },
  {
    value: "🫂 Console",
    label: "Console",
    emoji: "🫂",
    description: "Warmth and total presence",
  },
  {
    value: "😂 Dark Humor",
    label: "Dark Humor",
    emoji: "😂",
    description: "Laugh at pain and absurdity",
  },
  {
    value: "✍️ Create",
    label: "Create",
    emoji: "✍️",
    description: "Literary creative collaborator",
  },
];

export default function StepFive({ value, onChange }: StepFiveProps) {
  return (
    <div>
      <div style={labelStyle}>05 — Mode</div>
      <OptionGrid
        options={MODE_OPTIONS}
        selected={value}
        onSelect={onChange}
        columns={2}
      />
    </div>
  );
}
