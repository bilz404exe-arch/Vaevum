import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Auth redirect: if session exists, go to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        // Trigger fade-up animation only when we know we're rendering the page
        setVisible(true);
      }
    });
  }, [router]);

  return (
    <PageWrapper>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          50%  { background-position: 100% center; }
          100% { background-position: 0% center; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Full-viewport centered layout */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050507",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Rotating decorative ring — behind the logo */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            border: "1px solid rgba(157,140,255,0.15)",
            borderRadius: "50%",
            animation: "spin 20s linear infinite",
            pointerEvents: "none",
          }}
        />

        {/* Logo + tagline + button — fade-up on load */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            position: "relative",
            zIndex: 1,
            animation: visible ? "fadeUp 0.8s ease forwards" : "none",
            opacity: visible ? undefined : 0,
          }}
        >
          {/* VAEVUM logo */}
          <h1
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "clamp(4rem, 10vw, 8rem)",
              fontWeight: 300,
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1,
              background:
                "linear-gradient(90deg, #9d8cff, #ff6b9d, #ffb347, #9d8cff)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 6s ease-in-out infinite",
            }}
          >
            VAEVUM
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "1rem",
              fontStyle: "italic",
              color: "#6b6880",
              margin: 0,
              textAlign: "center",
              maxWidth: 420,
              lineHeight: 1.6,
            }}
          >
            Dark enough to hold your secrets. Real enough to understand them.
          </p>

          {/* ENTER button */}
          <Button variant="default" onClick={() => router.push("/auth")}>
            ENTER
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
