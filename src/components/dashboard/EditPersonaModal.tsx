import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Persona, ContentMode } from "@/types";
import { fetchWithAuth } from "@/lib/utils";

interface EditPersonaModalProps {
  persona: Persona;
  open: boolean;
  onClose: () => void;
  onSave: (updated: Persona) => void;
}

const MODES: ContentMode[] = [
  "💬 Default",
  "🌶️ Spicy",
  "🖤 Dark",
  "🕯️ Erotic",
  "😤 Grievance",
  "🫂 Console",
  "😂 Dark Humor",
  "✍️ Create",
];

export default function EditPersonaModal({
  persona,
  open,
  onClose,
  onSave,
}: EditPersonaModalProps) {
  const [name, setName] = useState(persona.name);
  const [mode, setMode] = useState<ContentMode>(persona.mode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync state when persona prop changes (e.g. opening modal for different persona)
  useEffect(() => {
    setName(persona.name);
    setMode(persona.mode);
    setError("");
  }, [persona.id, persona.name, persona.mode]);

  async function handleSave() {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (trimmed.length > 24) {
      setError("Name must be 24 characters or fewer.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/personas/${persona.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, mode }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          (json as { error?: string }).error ?? "Failed to save changes.",
        );
        return;
      }

      const updated: Persona = await res.json();
      onSave(updated);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6b6880",
    marginBottom: "8px",
    display: "block",
  };

  const modeGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "4px",
  };

  const errorStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.75rem",
    color: "#ff6b9d",
    marginTop: "12px",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${persona.name}`}
      confirmLabel={saving ? "Saving..." : "Save"}
      onConfirm={handleSave}
      confirmDisabled={saving}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Name field */}
        <Input
          id="edit-persona-name"
          label="Name"
          type="text"
          value={name}
          onChange={(val) => {
            setName(val.slice(0, 24));
            setError("");
          }}
          placeholder="Persona name"
          disabled={saving}
        />

        {/* Mode selector */}
        <div>
          <span style={labelStyle}>Mode</span>
          <div style={modeGridStyle}>
            {MODES.map((m) => {
              const isSelected = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={saving}
                  style={{
                    background: isSelected
                      ? "rgba(157,140,255,0.12)"
                      : "transparent",
                    border: isSelected
                      ? "1px solid rgba(157,140,255,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 0,
                    color: isSelected ? "#9d8cff" : "#6b6880",
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "8px 10px",
                    cursor: saving ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition:
                      "border-color 0.15s ease, color 0.15s ease, background 0.15s ease",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline error */}
        {error && <p style={errorStyle}>{error}</p>}
      </div>
    </Modal>
  );
}
