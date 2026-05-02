import React, { useState } from "react";
import ModeBadge from "@/components/ui/ModeBadge";
import { Persona } from "@/types";
import { truncate, relativeTime } from "@/lib/utils";

const ROLE_EMOJIS: Record<string, string> = {
  Girlfriend: "💕",
  Boyfriend: "💙",
  "Best Friend": "🤝",
  Therapist: "🧠",
  Dominant: "👑",
  Submissive: "🌸",
  Protector: "🛡️",
  Villain: "🖤",
  Mentor: "🔮",
  Custom: "✨",
};

interface PersonaCardProps {
  persona: Persona;
  lastMessage: string | null;
  lastActive: string;
  conversationId: string;
  onDelete: (personaId: string) => void;
  onEdit: (personaId: string) => void;
  onClick: () => void;
}

export default function PersonaCard({
  persona,
  lastMessage,
  lastActive,
  onDelete,
  onEdit,
  onClick,
}: PersonaCardProps) {
  const [hovered, setHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    background: "#12121c",
    border: `1px solid ${hovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)"}`,
    borderRadius: 0,
    padding: "20px",
    cursor: "pointer",
    position: "relative",
    transition: "border-color 0.2s ease",
  };

  const avatarStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    background: "rgba(157,140,255,0.08)",
    border: "1px solid rgba(157,140,255,0.15)",
    borderRadius: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: '"Cormorant Garamond", serif',
    fontStyle: "italic",
    fontSize: "1.1rem",
    color: "#e8e6f0",
    marginTop: "12px",
    marginBottom: 0,
  };

  const roleStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6b6880",
    marginTop: "4px",
    marginBottom: 0,
  };

  const previewStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.75rem",
    color: "#6b6880",
    marginTop: "8px",
    marginBottom: 0,
  };

  const timestampStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    color: "#3a3850",
    marginTop: "4px",
    marginBottom: 0,
  };

  const iconBtnBase: React.CSSProperties = {
    position: "absolute",
    top: "12px",
    background: "none",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
    opacity: hovered ? 1 : 0,
    transition: "opacity 0.15s ease",
    pointerEvents: hovered ? "auto" : "none",
  };

  const deleteButtonStyle: React.CSSProperties = {
    ...iconBtnBase,
    right: "12px",
    color: "#ff6b9d",
    fontSize: "1.25rem",
  };

  const editButtonStyle: React.CSSProperties = {
    ...iconBtnBase,
    right: "36px",
    color: "#9d8cff",
    fontSize: "0.9rem",
  };

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(persona.id);
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(persona.id);
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Avatar */}
      <div style={avatarStyle}>{ROLE_EMOJIS[persona.role] ?? "✨"}</div>

      {/* Persona name */}
      <p style={nameStyle}>{persona.name}</p>

      {/* Role label */}
      <p style={roleStyle}>{persona.role}</p>

      {/* Last message preview */}
      <p style={previewStyle}>{truncate(lastMessage ?? "", 60)}</p>

      {/* Relative timestamp */}
      <p style={timestampStyle}>{relativeTime(lastActive)}</p>

      {/* Mode badge */}
      <div style={{ marginTop: "8px" }}>
        <ModeBadge mode={persona.mode} />
      </div>

      {/* Edit icon */}
      <button
        style={editButtonStyle}
        onClick={handleEditClick}
        aria-label={`Edit ${persona.name}`}
      >
        ✏
      </button>

      {/* Delete icon */}
      <button
        style={deleteButtonStyle}
        onClick={handleDeleteClick}
        aria-label={`Delete ${persona.name}`}
      >
        ×
      </button>
    </div>
  );
}
