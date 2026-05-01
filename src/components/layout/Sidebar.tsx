import React from "react";
import { Persona } from "@/types";
import ModeBar from "@/components/chat/ModeBar";
import Button from "@/components/ui/Button";

interface SidebarProps {
  persona: Persona;
  activeMode: string;
  onModeChange: (mode: string) => void;
  onRebuildPersona: () => void;
}

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

export default function Sidebar({
  persona,
  activeMode,
  onModeChange,
  onRebuildPersona,
}: SidebarProps) {
  const roleEmoji = ROLE_EMOJIS[persona.role] ?? "✨";

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .sidebar-root {
          position: fixed;
          top: 0;
          left: 0;
          width: 220px;
          height: 100vh;
          z-index: 10;
          background: #050507;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          padding: 24px 0;
          box-sizing: border-box;
        }

        @media (max-width: 767px) {
          .sidebar-root {
            display: none;
          }
        }

        .sidebar-logo {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.25rem;
          font-weight: 400;
          padding: 0 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: linear-gradient(
            90deg,
            #9d8cff 0%,
            #e8e6f0 40%,
            #ff6b9d 60%,
            #9d8cff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 6s ease-in-out infinite;
          letter-spacing: 0.05em;
        }

        .sidebar-persona-card {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .sidebar-avatar {
          width: 40px;
          height: 40px;
          background: rgba(157, 140, 255, 0.08);
          border: 1px solid rgba(157, 140, 255, 0.15);
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .sidebar-persona-name {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.1rem;
          font-weight: 400;
          color: #e8e6f0;
          margin-top: 12px;
          margin-bottom: 0;
        }

        .sidebar-role-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6b6880;
          margin-top: 4px;
        }

        .sidebar-mode-section {
          padding: 20px 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-mode-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #3a3850;
          padding: 0 20px 8px;
        }

        .sidebar-rebuild {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sidebar-rebuild-btn {
          font-size: 0.7rem !important;
        }
      `}</style>

      <aside className="sidebar-root">
        {/* Logo mark */}
        <div className="sidebar-logo">VAEVUM</div>

        {/* Persona card */}
        <div className="sidebar-persona-card">
          <div className="sidebar-avatar" aria-hidden="true">
            {roleEmoji}
          </div>
          <p className="sidebar-persona-name">{persona.name}</p>
          <span className="sidebar-role-label">{persona.role}</span>
        </div>

        {/* Mode section */}
        <div className="sidebar-mode-section">
          <div className="sidebar-mode-label">Mode</div>
          <ModeBar activeMode={activeMode} onModeChange={onModeChange} />
        </div>

        {/* Rebuild Persona button */}
        <div className="sidebar-rebuild">
          <Button variant="default" fullWidth onClick={onRebuildPersona}>
            <span style={{ fontSize: "0.7rem" }}>Rebuild Persona</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
