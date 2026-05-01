import React, { useState } from "react";

interface OptionGridProps {
  options: Array<{
    value: string;
    label: string;
    emoji: string;
    description?: string;
  }>;
  selected: string | null;
  onSelect: (value: string) => void;
  columns?: 1 | 2;
}

export default function OptionGrid({
  options,
  selected,
  onSelect,
  columns = 1,
}: OptionGridProps) {
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "8px",
  };

  const getCardStyle = (value: string): React.CSSProperties => {
    const isSelected = selected === value;
    const isHovered = hoveredValue === value;

    if (isSelected) {
      return {
        background: "rgba(157,140,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 0 12px rgba(157,140,255,0.15)",
        borderRadius: 0,
        padding: "16px",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      };
    }

    return {
      background: "#12121c",
      border: `1px solid ${isHovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 0,
      padding: "16px",
      cursor: "pointer",
      transition: "border-color 0.2s ease",
    };
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    marginRight: "8px",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.875rem",
    color: "#e8e6f0",
  };

  const descriptionStyle: React.CSSProperties = {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: "0.875rem",
    color: "#6b6880",
    marginTop: "4px",
  };

  return (
    <div style={gridStyle}>
      {options.map((option) => (
        <div
          key={option.value}
          style={getCardStyle(option.value)}
          onClick={() => onSelect(option.value)}
          onMouseEnter={() => setHoveredValue(option.value)}
          onMouseLeave={() => setHoveredValue(null)}
          role="button"
          aria-label={`${option.label}${selected === option.value ? ", selected" : ""}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(option.value);
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={emojiStyle} aria-hidden="true">
              {option.emoji}
            </span>
            <span style={labelStyle}>{option.label}</span>
          </div>
          {option.description && (
            <div style={descriptionStyle}>{option.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
