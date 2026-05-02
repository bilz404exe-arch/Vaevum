import React from "react";
import Button from "../ui/Button";

interface HeaderProps {
  userEmail?: string;
  username?: string;
  avatarUrl?: string;
  onLogout?: () => void;
}

export default function Header({
  userEmail,
  username,
  avatarUrl,
  onLogout,
}: HeaderProps) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
      `}</style>
      <header
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "#050507",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        {/* Left: VAEVUM logo */}
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: "1.5rem",
            fontWeight: 300,
            fontStyle: "italic",
            background:
              "linear-gradient(90deg, #9d8cff, #ff6b9d, #ffb347, #9d8cff)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 6s ease-in-out infinite",
          }}
        >
          VAEVUM
        </span>

        {/* Right: avatar + username + logout */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {(username || userEmail) && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Avatar image if available */}
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={username ?? "avatar"}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: "0.75rem",
                  color: "#6b6880",
                }}
              >
                {username ? `@${username}` : userEmail}
              </span>
            </div>
          )}
          {onLogout && (
            <div style={{ fontSize: "0.75rem" }}>
              <Button variant="default" onClick={onLogout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
