interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  modeAtTime?: string | null;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === "assistant") {
    return (
      <>
        <style>{`
          @keyframes fadeUpSmall {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            animation: "fadeUpSmall 0.3s ease forwards",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "32px",
              height: "32px",
              minWidth: "32px",
              background: "rgba(157,140,255,0.1)",
              border: "1px solid rgba(157,140,255,0.2)",
              borderRadius: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9d8cff",
              fontSize: "0.75rem",
            }}
          >
            ◆
          </div>

          {/* Bubble */}
          <div
            style={{
              background: "#12121c",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0",
              padding: "16px",
              maxWidth: "70%",
            }}
          >
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1rem",
                color: "#e8e6f0",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {content}
            </p>
          </div>
        </div>
      </>
    );
  }

  // User bubble
  return (
    <>
      <style>{`
        @keyframes fadeUpSmall {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          animation: "fadeUpSmall 0.3s ease forwards",
        }}
      >
        <div
          style={{
            background: "#1a1a28",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "0",
            padding: "16px",
            maxWidth: "70%",
          }}
        >
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.875rem",
              color: "#e8e6f0",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {content}
          </p>
        </div>
      </div>
    </>
  );
}
