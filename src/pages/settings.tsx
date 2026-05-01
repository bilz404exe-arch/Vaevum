import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useRequireAuth } from "@/lib/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { fetchWithAuth } from "@/lib/utils";
import { Persona } from "@/types";

export default function SettingsPage() {
  const { loading } = useRequireAuth();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const router = useRouter();

  // ─── Username state ───────────────────────────────────────────────────────
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Sync profile username into input when loaded
  useEffect(() => {
    if (profile?.username) setUsernameInput(profile.username);
  }, [profile?.username]);

  // ─── Change Password state ────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ─── Personas state ───────────────────────────────────────────────────────
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);

  // ─── Delete Account state ─────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Fetch personas on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    async function fetchPersonas() {
      setPersonasLoading(true);
      try {
        const res = await fetchWithAuth("/api/personas");
        if (res.ok) {
          const data: Persona[] = await res.json();
          setPersonas(data);
        }
      } catch {
        // Silently fail
      } finally {
        setPersonasLoading(false);
      }
    }

    fetchPersonas();
  }, [loading]);

  // Auth guard — wait for session check
  if (loading) return null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");
    if (usernameInput.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(usernameInput)) {
      setUsernameError("Only letters, numbers, and underscores allowed.");
      return;
    }
    setUsernameLoading(true);
    const { error } = await updateProfile({
      username: usernameInput.trim().toLowerCase(),
    });
    if (error) setUsernameError(error);
    else setUsernameSuccess("Username updated.");
    setUsernameLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetchWithAuth("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        setPasswordSuccess("Password updated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeletePersona(personaId: string) {
    try {
      const res = await fetchWithAuth(`/api/personas/${personaId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPersonas((prev) => prev.filter((p) => p.id !== personaId));
      }
    } catch {
      // Silently fail
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteLoading(true);
    try {
      const res = await fetchWithAuth("/api/user", { method: "DELETE" });

      if (res.ok) {
        await signOut();
        router.push("/");
      }
    } catch {
      // Silently fail — signOut and redirect anyway
      await signOut();
      router.push("/");
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    maxWidth: "640px",
    margin: "0 auto",
    padding: "48px 24px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6b6880",
    marginBottom: "16px",
  };

  const sectionStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: "32px",
    marginTop: "32px",
  };

  const emailStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.875rem",
    color: "#6b6880",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const inlineSuccessStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.75rem",
    color: "#9d8cff",
    marginTop: "8px",
  };

  const inlineErrorStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.75rem",
    color: "#ff6b9d",
    marginTop: "8px",
  };

  const personaListStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const personaRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const personaInfoStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const personaNameStyle: React.CSSProperties = {
    fontFamily: '"Cormorant Garamond", serif',
    fontStyle: "italic",
    fontSize: "1rem",
    color: "#e8e6f0",
    fontWeight: 300,
  };

  const personaRoleStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.75rem",
    color: "#6b6880",
  };

  const personaDateStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    color: "#6b6880",
  };

  const dangerTitleStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#ff6b9d",
    marginBottom: "16px",
  };

  const modalBodyStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.8rem",
    color: "#6b6880",
    marginBottom: "20px",
    lineHeight: "1.6",
  };

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <PageWrapper>
      <Header
        userEmail={user?.email}
        username={profile?.username}
        onLogout={signOut}
      />

      <div style={containerStyle}>
        {/* ── Account Section ─────────────────────────────────────────────── */}
        <section>
          <p style={sectionTitleStyle}>Account</p>
          <div style={emailStyle}>{user?.email}</div>
        </section>

        {/* ── Username Section ─────────────────────────────────────────────── */}
        <section style={sectionStyle}>
          <p style={sectionTitleStyle}>Username</p>
          <form onSubmit={handleUsernameSubmit} style={formStyle}>
            <Input
              id="username"
              label="Username"
              type="text"
              value={usernameInput}
              onChange={(val) => {
                setUsernameInput(val);
                setUsernameError("");
                setUsernameSuccess("");
              }}
              placeholder="your_username"
              disabled={usernameLoading}
              error={usernameError || undefined}
            />
            {usernameSuccess && (
              <span style={inlineSuccessStyle}>{usernameSuccess}</span>
            )}
            <div>
              <Button
                type="submit"
                variant="default"
                loading={usernameLoading}
                disabled={usernameLoading}
              >
                Update Username
              </Button>
            </div>
          </form>
        </section>

        {/* ── Change Password Section ──────────────────────────────────────── */}
        <section style={sectionStyle}>
          <p style={sectionTitleStyle}>Change Password</p>
          <form onSubmit={handlePasswordSubmit} style={formStyle}>
            <Input
              id="current-password"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Current password"
              disabled={passwordLoading}
            />
            <Input
              id="new-password"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="New password"
              disabled={passwordLoading}
            />
            <Input
              id="confirm-password"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              disabled={passwordLoading}
            />

            {passwordError && (
              <span style={inlineErrorStyle}>{passwordError}</span>
            )}
            {passwordSuccess && (
              <span style={inlineSuccessStyle}>{passwordSuccess}</span>
            )}

            <div>
              <Button
                type="submit"
                variant="default"
                loading={passwordLoading}
                disabled={passwordLoading}
              >
                Update Password
              </Button>
            </div>
          </form>
        </section>

        {/* ── Personas Section ─────────────────────────────────────────────── */}
        <section style={sectionStyle}>
          <p style={sectionTitleStyle}>Personas</p>

          {personasLoading ? (
            <p
              style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.75rem",
                color: "#6b6880",
              }}
            >
              Loading...
            </p>
          ) : personas.length === 0 ? (
            <p
              style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.75rem",
                color: "#6b6880",
              }}
            >
              No personas yet.
            </p>
          ) : (
            <div style={personaListStyle}>
              {personas.map((persona) => (
                <div key={persona.id} style={personaRowStyle}>
                  <div style={personaInfoStyle}>
                    <span style={personaNameStyle}>{persona.name}</span>
                    <span style={personaRoleStyle}>{persona.role}</span>
                    <span style={personaDateStyle}>
                      {formatDate(persona.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem" }}>
                    <Button
                      variant="danger"
                      onClick={() => handleDeletePersona(persona.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Danger Zone Section ──────────────────────────────────────────── */}
        <section style={sectionStyle}>
          <p style={dangerTitleStyle}>Danger Zone</p>
          <Button
            variant="danger"
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteModalOpen(true);
            }}
          >
            Delete Account
          </Button>
        </section>
      </div>

      {/* ── Delete Account Modal ─────────────────────────────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        confirmDisabled={deleteConfirmText !== "DELETE" || deleteLoading}
      >
        <p style={modalBodyStyle}>
          Your account will be deactivated immediately. Your conversations and
          data will be permanently deleted within 30 days.
        </p>
        <Input
          id="delete-confirm"
          label='Type "DELETE" to confirm'
          type="text"
          value={deleteConfirmText}
          onChange={setDeleteConfirmText}
          placeholder="DELETE"
        />
      </Modal>
    </PageWrapper>
  );
}
