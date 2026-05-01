interface ModeDividerProps {
  mode: string;
}

export default function ModeDivider({ mode }: ModeDividerProps) {
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          textAlign: "center",
          padding: "16px 0",
          width: "100%",
          animation: "fadeIn 0.3s ease forwards",
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.875rem",
            color: "#6b6880",
          }}
        >
          — mode: {mode} —
        </span>
      </div>
    </>
  );
}
