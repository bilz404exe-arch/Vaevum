import React from "react";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";

export default function EmptyState() {
  const router = useRouter();

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    textAlign: "center",
  };

  const messageStyle: React.CSSProperties = {
    fontFamily: '"Cormorant Garamond", serif',
    fontStyle: "italic",
    fontSize: "1.5rem",
    color: "#6b6880",
    marginBottom: "24px",
    marginTop: 0,
  };

  return (
    <div style={containerStyle}>
      <p style={messageStyle}>You haven&apos;t built your Vaevum yet.</p>
      <Button variant="gradient" onClick={() => router.push("/builder")}>
        Build Your Vaevum
      </Button>
    </div>
  );
}
