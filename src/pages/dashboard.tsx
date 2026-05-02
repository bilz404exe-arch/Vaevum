import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import PersonaCard from "@/components/dashboard/PersonaCard";
import EditPersonaModal from "@/components/dashboard/EditPersonaModal";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/ui/Modal";
import { useRequireAuth } from "@/lib/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { fetchWithAuth, relativeTime, truncate } from "@/lib/utils";
import { Persona, Conversation } from "@/types";

// Persona enriched with conversation data for display
interface PersonaWithConversation extends Persona {
  conversationId: string;
  lastMessage: string | null;
  lastActive: string;
}

interface DeleteModal {
  open: boolean;
  personaId: string;
  personaName: string;
}

interface EditModalState {
  open: boolean;
  persona: PersonaWithConversation;
}

export default function DashboardPage() {
  const { loading } = useRequireAuth();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  const [personas, setPersonas] = useState<PersonaWithConversation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<DeleteModal | null>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);

  useEffect(() => {
    // Don't fetch until auth check is complete
    if (loading) return;

    async function loadData() {
      setDataLoading(true);
      try {
        // Fetch all active personas (sorted by last_active DESC via API)
        const personasRes = await fetchWithAuth("/api/personas");
        if (!personasRes.ok) {
          setDataLoading(false);
          return;
        }
        const personaList: Persona[] = await personasRes.json();

        // Fetch conversation for each persona in parallel
        const enriched = await Promise.all(
          personaList.map(async (persona): Promise<PersonaWithConversation> => {
            try {
              const convRes = await fetchWithAuth(
                `/api/conversations/${persona.id}`,
              );
              if (!convRes.ok) {
                return {
                  ...persona,
                  conversationId: "",
                  lastMessage: null,
                  lastActive: persona.updated_at,
                };
              }
              const conversation: Conversation = await convRes.json();
              return {
                ...persona,
                conversationId: conversation.id,
                lastMessage: conversation.last_message,
                lastActive: conversation.last_active,
              };
            } catch {
              return {
                ...persona,
                conversationId: "",
                lastMessage: null,
                lastActive: persona.updated_at,
              };
            }
          }),
        );

        setPersonas(enriched);
      } catch {
        // Silently fail — show empty state
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [loading]);

  // Auth guard — wait for session check (after all hooks)
  if (loading) return null;

  function handlePersonaClick(conversationId: string) {
    if (conversationId) {
      router.push(`/chat/${conversationId}`);
    }
  }

  function handleDeleteRequest(personaId: string) {
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;
    setDeleteModal({ open: true, personaId, personaName: persona.name });
  }

  async function handleDeleteConfirm() {
    if (!deleteModal) return;
    const { personaId } = deleteModal;

    try {
      const res = await fetchWithAuth(`/api/personas/${personaId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPersonas((prev) => prev.filter((p) => p.id !== personaId));
      }
    } catch {
      // Silently fail — modal will close regardless
    } finally {
      setDeleteModal(null);
    }
  }

  function handleDeleteCancel() {
    setDeleteModal(null);
  }

  function handleEditRequest(personaId: string) {
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;
    setEditModal({ open: true, persona });
  }

  function handleEditSave(updated: Persona) {
    setPersonas((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
    setEditModal(null);
  }

  function handleEditClose() {
    setEditModal(null);
  }

  // ─── Recent conversations (last 5 with a conversationId, sorted by lastActive) ──

  const recentConversations = personas
    .filter((p) => p.conversationId)
    .sort(
      (a, b) =>
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
    )
    .slice(0, 5);

  // ─── Skeleton card component ──────────────────────────────────────────────

  function SkeletonCard() {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 0,
          minHeight: "160px",
          animation: "skeletonPulse 1.8s ease-in-out infinite",
        }}
      />
    );
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  const mainStyle: React.CSSProperties = {
    padding: "32px",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  };

  // New Persona card — same visual style as PersonaCard
  const newCardStyle: React.CSSProperties = {
    background: "#12121c",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 0,
    padding: "20px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "160px",
    transition: "border-color 0.2s ease",
  };

  const newCardIconStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "1.5rem",
    color: "#9d8cff",
    marginBottom: "8px",
  };

  const newCardLabelStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6b6880",
  };

  const recentSectionStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    marginTop: "32px",
    paddingTop: "24px",
  };

  const recentTitleStyle: React.CSSProperties = {
    fontFamily: '"Space Mono", monospace',
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6b6880",
    marginBottom: "16px",
  };

  const recentRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  };

  return (
    <PageWrapper>
      <Header
        userEmail={user?.email}
        username={profile?.username}
        avatarUrl={profile?.avatar_url ?? undefined}
        onLogout={signOut}
      />

      <main style={mainStyle}>
        {/* Responsive grid — 2 col desktop, 1 col mobile via inline media */}
        <style>{`
          @media (max-width: 767px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @keyframes skeletonPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>

        {!dataLoading && personas.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="dashboard-grid" style={gridStyle}>
              {/* "+ New Persona" card — always first */}
              <div
                style={newCardStyle}
                onClick={() => router.push("/builder")}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.10)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.06)";
                }}
              >
                <span style={newCardIconStyle}>+</span>
                <span style={newCardLabelStyle}>New Persona</span>
              </div>

              {/* Skeleton cards while loading */}
              {dataLoading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}

              {/* Persona cards */}
              {!dataLoading &&
                personas.map((persona) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    lastMessage={persona.lastMessage}
                    lastActive={persona.lastActive}
                    conversationId={persona.conversationId}
                    onDelete={handleDeleteRequest}
                    onEdit={handleEditRequest}
                    onClick={() => handlePersonaClick(persona.conversationId)}
                  />
                ))}
            </div>

            {/* ── Recent Conversations ─────────────────────────────────── */}
            {!dataLoading && recentConversations.length > 0 && (
              <div style={recentSectionStyle}>
                <p style={recentTitleStyle}>Recent</p>
                <div>
                  {recentConversations.map((p) => (
                    <RecentRow
                      key={p.conversationId}
                      personaName={p.name}
                      lastMessage={p.lastMessage}
                      lastActive={p.lastActive}
                      rowStyle={recentRowStyle}
                      onClick={() => router.push(`/chat/${p.conversationId}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal
          open={deleteModal.open}
          onClose={handleDeleteCancel}
          title={`Remove ${deleteModal.personaName}?`}
          confirmLabel="Remove"
          onConfirm={handleDeleteConfirm}
        >
          <p
            style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: "0.8rem",
              color: "#6b6880",
              margin: 0,
            }}
          >
            This hides them from your dashboard.
          </p>
        </Modal>
      )}

      {/* Edit persona modal */}
      {editModal && (
        <EditPersonaModal
          persona={editModal.persona}
          open={editModal.open}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />
      )}
    </PageWrapper>
  );
}

// ─── Recent Row sub-component ─────────────────────────────────────────────────

interface RecentRowProps {
  personaName: string;
  lastMessage: string | null;
  lastActive: string;
  rowStyle: React.CSSProperties;
  onClick: () => void;
}

function RecentRow({
  personaName,
  lastMessage,
  lastActive,
  rowStyle,
  onClick,
}: RecentRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...rowStyle, opacity: hovered ? 0.7 : 1 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left: persona name + last message */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: "italic",
            fontSize: "1rem",
            color: "#e8e6f0",
            fontWeight: 300,
          }}
        >
          {personaName}
        </span>
        <span
          style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: "0.7rem",
            color: "#6b6880",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {truncate(lastMessage ?? "", 60)}
        </span>
      </div>

      {/* Right: relative timestamp */}
      <span
        style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: "0.65rem",
          color: "#3a3850",
          flexShrink: 0,
          marginLeft: "16px",
        }}
      >
        {relativeTime(lastActive)}
      </span>
    </div>
  );
}
