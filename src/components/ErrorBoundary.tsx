import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#050507",
            gap: "24px",
          }}
        >
          <p
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: "italic",
              fontSize: "1.25rem",
              color: "#6b6880",
              margin: 0,
            }}
          >
            Something went wrong.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 0,
              color: "#e8e6f0",
              fontFamily: '"Space Mono", monospace',
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "10px 24px",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
