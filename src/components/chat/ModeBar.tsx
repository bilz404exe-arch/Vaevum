import { useState } from "react";

interface ModeBarProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

const MODES = [
  "💬 Default",
  "🌶️ Spicy",
  "🖤 Dark",
  "🕯️ Erotic",
  "😤 Grievance",
  "🫂 Console",
  "😂 Dark Humor",
  "✍️ Create",
];

export default function ModeBar({ activeMode, onModeChange }: ModeBarProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {MODES.map((mode) => {
        const isActive = mode === activeMode;
        const isHovered = mode === hoveredMode;

        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            onMouseEnter={() => setHoveredMode(mode)}
            onMouseLeave={() => setHoveredMode(null)}
            style={{
              background: "transparent",
              border: "none",
              borderLeft: isActive
                ? "2px solid #9d8cff"
                : "2px solid transparent",
              padding: isActive ? "8px 12px 8px 10px" : "8px 12px",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: isActive ? "#9d8cff" : isHovered ? "#e8e6f0" : "#6b6880",
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
          >
            {mode}
          </button>
        );
      })}
    </div>
  );
}
