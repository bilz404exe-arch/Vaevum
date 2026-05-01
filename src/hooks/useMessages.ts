import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Message,
  MessagePage,
  Persona,
  ContentMode,
  ChatResponse,
} from "@/types";

// A message in the feed can be a real Message or a special UI item
type FeedItem =
  | Message
  | {
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

interface UseMessagesReturn {
  messages: FeedItem[];
  loading: boolean;
  sending: boolean;
  hasMore: boolean;
  sendMessage: (
    content: string,
    persona: Persona,
    currentMode: ContentMode,
  ) => Promise<void>;
  loadMore: () => Promise<void>;
}

// ─── Auth Helper ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<{ Authorization: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("No active session");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessages(conversationId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // ─── Initial Load ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/messages/${conversationId}`, { headers });
        if (!res.ok) {
          console.error(
            "Failed to fetch messages:",
            res.status,
            res.statusText,
          );
          return;
        }
        const data: MessagePage = await res.json();
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // ─── sendMessage ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (
      content: string,
      persona: Persona,
      currentMode: ContentMode,
    ): Promise<void> => {
      const now = new Date().toISOString();

      // Optimistic user message
      const optimisticUser: FeedItem = {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content,
        mode_at_time: currentMode,
        created_at: now,
        conversation_id: conversationId,
        user_id: "",
      };

      // Typing indicator placeholder
      const typingIndicator: FeedItem = {
        id: "typing",
        role: "assistant",
        content: "",
        isTyping: true,
        mode_at_time: null,
        created_at: now,
        conversation_id: conversationId,
        user_id: "",
      };

      setMessages((prev) => [...prev, optimisticUser, typingIndicator]);
      setSending(true);

      const doRequest = async (): Promise<Response> => {
        const headers = await getAuthHeaders();
        return fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            conversationId,
            message: content,
            persona,
            currentMode,
          }),
        });
      };

      try {
        let res = await doRequest();

        // Handle 429 rate limit: show "Give me a moment...", wait 2s, retry once
        if (res.status === 429) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "typing"
                ? {
                    ...m,
                    id: "typing",
                    content: "Give me a moment...",
                    isTyping: false,
                    isError: false,
                  }
                : m,
            ),
          );

          await new Promise((resolve) => setTimeout(resolve, 2000));
          res = await doRequest();
        }

        if (!res.ok) {
          // Non-429 error: show error bubble
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "typing"
                ? {
                    ...m,
                    id: `error-${Date.now()}`,
                    content:
                      "Something went quiet on my end. Still here — try again.",
                    isTyping: false,
                    isError: true,
                  }
                : m,
            ),
          );
          return;
        }

        const data: ChatResponse = await res.json();

        // Replace typing indicator with real AI message
        const aiMessage: FeedItem = {
          id: data.messageId,
          role: "assistant",
          content: data.content,
          mode_at_time: currentMode,
          created_at: new Date().toISOString(),
          conversation_id: conversationId,
          user_id: "",
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === "typing" ? aiMessage : m)),
        );
      } catch (err) {
        console.error("Error sending message:", err);
        // Network / unexpected error: show error bubble
        setMessages((prev) =>
          prev.map((m) =>
            m.id === "typing"
              ? {
                  ...m,
                  id: `error-${Date.now()}`,
                  content:
                    "Something went quiet on my end. Still here — try again.",
                  isTyping: false,
                  isError: true,
                }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  // ─── loadMore ───────────────────────────────────────────────────────────────

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || !nextCursor) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/messages/${conversationId}?cursor=${encodeURIComponent(nextCursor)}`,
        { headers },
      );
      if (!res.ok) {
        console.error(
          "Failed to load more messages:",
          res.status,
          res.statusText,
        );
        return;
      }
      const data: MessagePage = await res.json();
      // Prepend older messages to the front
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("Error loading more messages:", err);
    }
  }, [conversationId, hasMore, nextCursor]);

  return { messages, loading, sending, hasMore, sendMessage, loadMore };
}
