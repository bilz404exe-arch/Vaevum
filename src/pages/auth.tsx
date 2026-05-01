import React, { useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/lib/utils";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const resetErrors = () => {
    setError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setUsernameError(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    resetErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (mode === "signup") {
      let hasValidationError = false;

      if (username.trim().length < 3) {
        setUsernameError("Username must be at least 3 characters.");
        hasValidationError = true;
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameError("Only letters, numbers, and underscores allowed.");
        hasValidationError = true;
      }

      if (password.length < 8) {
        setPasswordError("Password must be at least 8 characters.");
        hasValidationError = true;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        hasValidationError = true;
      }

      if (hasValidationError) return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const authError = await signUp(email, password);
        if (authError) {
          setError(authError.message);
          return;
        }
        // Create profile with username after successful signup
        try {
          await fetchWithAuth("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.trim().toLowerCase() }),
          });
        } catch {
          // Profile creation failure is non-fatal — user can set it in settings
        }
        router.push("/builder");
      } else {
        const authError = await signIn(email, password);
        if (authError) {
          setError(authError.message);
        } else {
          router.push("/dashboard");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <style>{`
          @keyframes shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .auth-card {
            background: #12121c;
            border: 1px solid rgba(255,255,255,0.06);
            padding: 48px;
            width: 100%;
            max-width: 480px;
          }
          @media (max-width: 767px) {
            .auth-card {
              padding: 32px 24px;
            }
          }
        `}</style>
        <div className="auth-card">
          {/* VAEVUM logo */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "2rem",
                letterSpacing: "0.3em",
                background:
                  "linear-gradient(135deg, #9d8cff, #ff6b9d, #ffb347, #9d8cff)",
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 6s ease-in-out infinite",
                display: "inline-block",
              }}
            >
              VAEVUM
            </span>
          </div>

          {/* Form title */}
          <h1
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 300,
              fontSize: "1.5rem",
              color: "#e8e6f0",
              margin: "0 0 32px 0",
              textAlign: "center",
            }}
          >
            {mode === "login" ? "Welcome back." : "Create your account."}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                disabled={loading}
              />

              {mode === "signup" && (
                <Input
                  id="username"
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(val) => {
                    setUsername(val);
                    if (usernameError) setUsernameError(null);
                  }}
                  placeholder="your_username"
                  disabled={loading}
                  error={usernameError ?? undefined}
                />
              )}

              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(val) => {
                  setPassword(val);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="••••••••"
                disabled={loading}
                error={passwordError ?? undefined}
              />

              {mode === "signup" && (
                <Input
                  id="confirm-password"
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(val) => {
                    setConfirmPassword(val);
                    if (confirmPasswordError) setConfirmPasswordError(null);
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  error={confirmPasswordError ?? undefined}
                />
              )}

              {/* Auth error message */}
              {error && (
                <span
                  role="alert"
                  style={{
                    color: "#ff6b9d",
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.75rem",
                    display: "block",
                  }}
                >
                  {error}
                </span>
              )}

              <Button
                type="submit"
                variant="gradient"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {mode === "login" ? "Log In" : "Sign Up"}
              </Button>
            </div>
          </form>

          {/* Toggle link */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            {mode === "login" ? (
              <span
                style={{
                  fontFamily: '"Space Mono", monospace',
                  color: "#6b6880",
                  fontSize: "0.75rem",
                }}
              >
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontFamily: '"Space Mono", monospace',
                    color: "#9d8cff",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Sign up
                </button>
              </span>
            ) : (
              <span
                style={{
                  fontFamily: '"Space Mono", monospace',
                  color: "#6b6880",
                  fontSize: "0.75rem",
                }}
              >
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontFamily: '"Space Mono", monospace',
                    color: "#9d8cff",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Log in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
