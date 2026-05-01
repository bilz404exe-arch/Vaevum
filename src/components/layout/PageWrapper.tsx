import React, { useEffect, useRef } from "react";

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide the default cursor
    document.body.style.cursor = "none";

    const dot = dotRef.current;
    const ring = ringRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (dot) {
        dot.style.left = `${x - 4}px`;
        dot.style.top = `${y - 4}px`;
      }

      if (ring) {
        ring.style.left = `${x - 14}px`;
        ring.style.top = `${y - 14}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <>
      {/* Noise texture SVG overlay */}
      <svg
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.03,
          zIndex: 9999,
        }}
      >
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={3}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Ambient glow blob — top-left purple */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at top left, rgba(157,140,255,0.04), transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Ambient glow blob — bottom-right pink */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at bottom right, rgba(255,107,157,0.03), transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Ambient glow blob — mid-left gold */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at 20% 60%, rgba(255,179,71,0.02), transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Custom cursor — dot (follows exactly) */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          width: 8,
          height: 8,
          background: "white",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 10000,
          mixBlendMode: "difference",
          top: 0,
          left: 0,
        }}
      />

      {/* Custom cursor — ring (follows with ~80ms lag) */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          width: 28,
          height: 28,
          border: "1px solid white",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 10000,
          mixBlendMode: "difference",
          top: 0,
          left: 0,
          transition: "left 80ms ease, top 80ms ease",
        }}
      />

      {/* Page content */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </>
  );
}
