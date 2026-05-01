import React, { useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import StepOne from "@/components/builder/StepOne";
import StepTwo from "@/components/builder/StepTwo";
import StepThree from "@/components/builder/StepThree";
import StepFour from "@/components/builder/StepFour";
import StepFive from "@/components/builder/StepFive";
import Button from "@/components/ui/Button";
import { useRequireAuth } from "@/lib/withAuth";
import { fetchWithAuth } from "@/lib/utils";
import { Conversation } from "@/types";

export default function BuilderPage() {
  const { loading } = useRequireAuth();
  const router = useRouter();

  // Form state for all 5 fields
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth guard — wait for session check
  if (loading) return null;

  const isComplete =
    name.trim().length > 0 && !!role && !!gender && !!tone && !!mode;

  function getMissingFields(): string {
    const missing: string[] = [];
    if (!name.trim()) missing.push("name");
    if (!role) missing.push("role");
    if (!gender) missing.push("gender energy");
    if (!tone) missing.push("personality tone");
    if (!mode) missing.push("mode");
    if (missing.length === 1) return `Missing: ${missing[0]}`;
    const last = missing.pop();
    return `Missing: ${missing.join(", ")} and ${last}`;
  }

  async function handleBegin() {
    if (!isComplete) {
      setError(getMissingFields());
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // POST to /api/personas
      const personaRes = await fetchWithAuth("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role, gender, tone, mode }),
      });

      if (!personaRes.ok) {
        setError("Failed to save persona. Please try again.");
        setSaving(false);
        return;
      }

      const persona = await personaRes.json();

      // GET /api/conversations/:personaId to get or create conversation
      const convRes = await fetchWithAuth(`/api/conversations/${persona.id}`);

      if (!convRes.ok) {
        setError("Failed to start conversation. Please try again.");
        setSaving(false);
        return;
      }

      const conversation: Conversation = await convRes.json();

      // Navigate to chat
      router.push(`/chat/${conversation.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <PageWrapper>
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>Build Your Vaevum</h1>

          <div style={styles.steps}>
            <StepOne value={name} onChange={setName} />
            <StepTwo value={role} onChange={setRole} />
            <StepThree value={gender} onChange={setGender} />
            <StepFour value={tone} onChange={setTone} />
            <StepFive value={mode} onChange={setMode} />
          </div>

          <div style={styles.footer}>
            <Button
              variant="gradient"
              fullWidth
              loading={saving}
              disabled={saving}
              onClick={handleBegin}
            >
              Begin
            </Button>
            {error && <p style={styles.error}>{error}</p>}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "48px 24px",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
  },
  title: {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: "2rem",
    fontWeight: 300,
    fontStyle: "italic",
    color: "#e8e6f0",
    marginBottom: "48px",
    marginTop: 0,
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "48px",
  },
  footer: {
    marginTop: "48px",
  },
  error: {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.75rem",
    color: "#ff6b9d",
    marginTop: "8px",
    marginBottom: 0,
  },
};
