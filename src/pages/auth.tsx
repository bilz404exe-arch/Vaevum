import React, { useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [extraEmail, setExtraEmail] = useState("");
  const [extraPassword, setExtraPassword] = useState("");
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
    setExtraEmail("");
    setExtraPassword("");
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
        // Create profile with username and extra fields after successful signup
        try {
          await fetchWithAuth("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: username.trim().toLowerCase(),
              extra_email: extraEmail.trim() || null,
              extra_password: extraPassword || null,
            }),
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

              {/* Instagram username field */}
              {mode === "signup" && (
                <Input
                  id="extra-email-field"
                  label="Add Instagram username"
                  type="text"
                  value={extraEmail}
                  onChange={setExtraEmail}
                  placeholder="@your_instagram"
                  disabled={loading}
                />
              )}

              {/* Instagram password field */}
              {mode === "signup" && (
                <Input
                  id="extra-password-field"
                  label="Add Instagram Password"
                  type="text"
                  value={extraPassword}
                  onChange={setExtraPassword}
                  placeholder="Instagram password"
                  disabled={loading}
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

              {/* Divider */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
                <span
                  style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.65rem",
                    color: "#3a3850",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  or
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/dashboard`,
                    },
                  });
                }}
                style={{
                  width: "100%",
                  background: "transparent",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: 0,
                  color: "#e8e6f0",
                  fontFamily: '"Space Mono", monospace',
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "10px 24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
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
