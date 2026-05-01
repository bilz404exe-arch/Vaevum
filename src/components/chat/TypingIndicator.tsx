export default function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typingPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
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
            padding: "16px",
          }}
        >
          {/* Dots */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: 0,
                background: "#9d8cff",
                animation: "typingPulse 1.2s ease-in-out 0s infinite",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: 0,
                background: "#ff6b9d",
                animation: "typingPulse 1.2s ease-in-out 0.4s infinite",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: 0,
                background: "#ffb347",
                animation: "typingPulse 1.2s ease-in-out 0.8s infinite",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
