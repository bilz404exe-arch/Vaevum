import React from "react";

interface ModeBadgeProps {
  mode: string;
}

export default function ModeBadge({ mode }: ModeBadgeProps) {
  const style: React.CSSProperties = {
    background: "rgba(157,140,255,0.12)",
    border: "1px solid rgba(157,140,255,0.25)",
    color: "#9d8cff",
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderRadius: 0,
    padding: "2px 8px",
    display: "inline-block",
  };

  return <span style={style}>{mode}</span>;
}
