import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import PersonaCard from "@/components/dashboard/PersonaCard";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/ui/Modal";
import { useRequireAuth } from "@/lib/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { fetchWithAuth } from "@/lib/utils";
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

export default function DashboardPage() {
  const { loading } = useRequireAuth();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  const [personas, setPersonas] = useState<PersonaWithConversation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<DeleteModal | null>(null);

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

  return (
    <PageWrapper>
      <Header
        userEmail={user?.email}
        username={profile?.username}
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
                  onClick={() => handlePersonaClick(persona.conversationId)}
                />
              ))}
          </div>
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
    </PageWrapper>
  );
}
