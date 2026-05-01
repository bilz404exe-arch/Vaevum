import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Sidebar from "@/components/layout/Sidebar";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ModeDivider from "@/components/chat/ModeDivider";
import ModeBadge from "@/components/ui/ModeBadge";
import { useRequireAuth } from "@/lib/withAuth";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/lib/supabase";
import { OPENING_MESSAGES } from "@/lib/systemPrompt";
import type { Persona, Conversation, ContentMode } from "@/types";

// ─── Feed Item Types ──────────────────────────────────────────────────────────

type SyntheticMessage = {
  id: string;
  role: "assistant";
  content: string;
  isTyping?: boolean;
  isError?: boolean;
  mode_at_time: null;
  created_at: string;
  conversation_id: string;
  user_id: string;
};

type DividerItem = {
  id: string;
  isDivider: true;
  mode: string;
};

type FeedItem =
  | {
      id: string;
      role: "user" | "assistant";
      content: string;
      isTyping?: boolean;
      isError?: boolean;
      mode_at_time: string | null;
      created_at: string;
      conversation_id: string;
      user_id: string;
    }
  | SyntheticMessage
  | DividerItem;

function isDivider(item: FeedItem): item is DividerItem {
  return "isDivider" in item && item.isDivider === true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { loading } = useRequireAuth();
  const router = useRouter();
  const { id: conversationId } = router.query;

  // ─── State ──────────────────────────────────────────────────────────────────

  const [persona, setPersona] = useState<Persona | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [activeMode, setActiveMode] = useState<ContentMode>("💬 Default");
  const [dataLoading, setDataLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [extraFeedItems, setExtraFeedItems] = useState<FeedItem[]>([]);

  // ─── Refs ────────────────────────────────────────────────────────────────────

  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── useMessages ────────────────────────────────────────────────────────────

  const cid = typeof conversationId === "string" ? conversationId : "";
  const {
    messages,
    loading: messagesLoading,
    sending,
    hasMore,
    sendMessage,
    loadMore,
  } = useMessages(cid);
  const [loadingMore, setLoadingMore] = useState(false);
  const prevScrollHeightRef = useRef<number>(0);

  // ─── Online / Offline tracking ───────────────────────────────────────────────

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Data Loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!cid) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const headers = { Authorization: `Bearer ${session.access_token}` };

        // Fetch conversation by ID and personas in parallel
        const [convRes, personasRes] = await Promise.all([
          fetch(`/api/conversations/id/${cid}`, { headers }),
          fetch("/api/personas", { headers }),
        ]);

        if (!convRes.ok || !personasRes.ok) {
          console.error("Failed to load chat data");
          return;
        }

        const conv: Conversation = await convRes.json();
        const personas: Persona[] = await personasRes.json();

        const matchedPersona =
          personas.find((p) => p.id === conv.persona_id) ?? null;

        setConversation(conv);
        setPersona(matchedPersona);
        if (matchedPersona) {
          setActiveMode(matchedPersona.mode);
        }
      } catch (err) {
        console.error("Error loading chat data:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [cid]);

  // ─── Build combined feed ─────────────────────────────────────────────────────

  const buildFeed = useCallback((): FeedItem[] => {
    const feed: FeedItem[] = [];

    // Opening message: show when no real messages and not loading
    if (messages.length === 0 && !messagesLoading && persona) {
      const openingText = OPENING_MESSAGES[persona.role];
      feed.push({
        id: "opening-message",
        role: "assistant",
        content: openingText,
        mode_at_time: null,
        created_at: new Date().toISOString(),
        conversation_id: cid,
        user_id: "",
      });
    }

    // Real messages from useMessages
    for (const msg of messages) {
      feed.push(msg as FeedItem);
    }

    // Extra items (mode dividers injected on mode change)
    for (const item of extraFeedItems) {
      feed.push(item);
    }

    return feed;
  }, [messages, messagesLoading, persona, cid, extraFeedItems]);

  const feedItems = buildFeed();

  // ─── Smooth scroll to bottom ─────────────────────────────────────────────────

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, extraFeedItems]);

  // ─── Scroll-to-top pagination ─────────────────────────────────────────────────

  const handleFeedScroll = useCallback(async () => {
    const feed = feedRef.current;
    if (!feed || !hasMore || loadingMore) return;
    if (feed.scrollTop === 0) {
      prevScrollHeightRef.current = feed.scrollHeight;
      setLoadingMore(true);
      await loadMore();
      setLoadingMore(false);
      // Restore scroll position after prepend so the view doesn't jump
      requestAnimationFrame(() => {
        if (feedRef.current) {
          feedRef.current.scrollTop =
            feedRef.current.scrollHeight - prevScrollHeightRef.current;
        }
      });
    }
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.addEventListener("scroll", handleFeedScroll);
    return () => feed.removeEventListener("scroll", handleFeedScroll);
  }, [handleFeedScroll]);

  // ─── Textarea auto-resize ────────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [inputValue]);

  // ─── Mode change handler ─────────────────────────────────────────────────────

  const handleModeChange = useCallback((mode: string) => {
    const newMode = mode as ContentMode;
    setActiveMode(newMode);

    // Inject a mode divider into the feed
    const divider: DividerItem = {
      id: `divider-${Date.now()}`,
      isDivider: true,
      mode: newMode,
    };
    setExtraFeedItems((prev) => [...prev, divider]);
  }, []);

  // ─── Send message ────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || sending || !isOnline || !persona) return;

    setInputValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(content, persona, activeMode);
  }, [inputValue, sending, isOnline, persona, activeMode, sendMessage]);

  // ─── Keyboard handler ────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ─── Rebuild persona ─────────────────────────────────────────────────────────

  const handleRebuildPersona = useCallback(() => {
    router.push("/builder");
  }, [router]);

  // ─── Auth guard ──────────────────────────────────────────────────────────────

  if (loading) return null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      <style>{`
        .chat-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .chat-main {
          margin-left: 220px;
          display: flex;
          flex-direction: column;
          height: 100vh;
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 767px) {
          .chat-main {
            margin-left: 0;
          }
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .chat-header-name {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.25rem;
          font-weight: 400;
          color: #e8e6f0;
          margin: 0;
        }

        .chat-feed {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-input-area {
          flex-shrink: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .chat-input-row {
          display: flex;
          gap: 0;
          align-items: flex-end;
        }

        .chat-textarea {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-right: none;
          border-radius: 0;
          color: #e8e6f0;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          line-height: 1.6;
          padding: 12px 16px;
          resize: none;
          outline: none;
          min-height: 44px;
          max-height: 120px;
          overflow-y: auto;
          transition: border-color 0.2s ease;
        }

        .chat-textarea::placeholder {
          color: #3a3850;
        }

        .chat-textarea:focus {
          border-color: rgba(157, 140, 255, 0.3);
        }

        .chat-send-btn {
          background: linear-gradient(135deg, #9d8cff, #ff6b9d);
          border: none;
          border-radius: 0;
          padding: 10px 20px;
          color: #e8e6f0;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          align-self: stretch;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }

        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .chat-hint {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          color: #3a3850;
          text-align: center;
        }

        .chat-offline-indicator {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          color: #ff6b9d;
          text-align: center;
          letter-spacing: 0.05em;
        }

        .chat-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: #3a3850;
          font-size: 1rem;
        }

        .chat-load-more-indicator {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          color: #3a3850;
          text-align: center;
          padding: 4px 0;
        }

        .chat-header-name--loading {
          color: #3a3850;
        }
      `}</style>

      <div className="chat-layout">
        {/* Sidebar — only rendered when persona is loaded */}
        {persona && (
          <Sidebar
            persona={persona}
            activeMode={activeMode}
            onModeChange={handleModeChange}
            onRebuildPersona={handleRebuildPersona}
          />
        )}

        {/* Main chat area */}
        <main className="chat-main">
          {/* Header */}
          <header className="chat-header">
            {persona ? (
              <>
                <h1 className="chat-header-name">{persona.name}</h1>
                <ModeBadge mode={activeMode} />
              </>
            ) : (
              <h1 className="chat-header-name chat-header-name--loading">
                Loading...
              </h1>
            )}
          </header>

          {/* Message feed */}
          <div className="chat-feed" ref={feedRef}>
            {dataLoading || messagesLoading ? (
              <div className="chat-loading">loading your conversation...</div>
            ) : (
              <>
                {loadingMore && (
                  <p className="chat-load-more-indicator">
                    loading earlier messages...
                  </p>
                )}
                {feedItems.map((item) => {
                  if (isDivider(item)) {
                    return <ModeDivider key={item.id} mode={item.mode} />;
                  }

                  if ("isTyping" in item && item.isTyping) {
                    return <TypingIndicator key={item.id} />;
                  }

                  return (
                    <MessageBubble
                      key={item.id}
                      role={item.role as "user" | "assistant"}
                      content={item.content}
                      modeAtTime={item.mode_at_time}
                    />
                  );
                })}
              </>
            )}
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Say anything..."
                rows={1}
                disabled={!isOnline}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={sending || !isOnline || !inputValue.trim()}
                aria-label="Send message"
              >
                Send
              </button>
            </div>

            {!isOnline ? (
              <p className="chat-offline-indicator">you&apos;re offline</p>
            ) : (
              <p className="chat-hint">
                everything stays between you and vaevum
              </p>
            )}
          </div>
        </main>
      </div>
    </PageWrapper>
  );
}
