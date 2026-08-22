import { useState } from "react";
import { apiRequest } from "./api";

type AuthMode = "login" | "register";

type AuthResponse = {
  success: boolean;
  message?: string;
  token?: string;
  data?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }

      setSuccess("Login successful!");

      console.log("Login response:", response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
        }),
      });

      console.log("Registration response:", response);

      setSuccess(
        "Account created successfully! Please sign in.",
      );

      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setMode("login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />
      </div>

      <main className="auth-container">
        {/* Left side */}
        <section className="auth-brand">
          <div className="brand-content">
            <div className="brand-icon">🚗</div>

            <p className="brand-label">
              PREMIUM VEHICLE MANAGEMENT
            </p>

            <h1>
              Find your
              <span> perfect ride.</span>
            </h1>

            <p className="brand-description">
              Manage vehicles, dealerships and inventory from one
              powerful platform.
            </p>

            <div className="brand-features">
              <div className="feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Smart inventory</strong>
                  <p>Keep every vehicle organized.</p>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Easy management</strong>
                  <p>Manage your dealership effortlessly.</p>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Secure access</strong>
                  <p>Role-based access for your team.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right side */}
        <section className="auth-card">
          <div className="auth-header">
            <div className="mobile-brand-icon">🚗</div>

            <h2>
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p>
              {mode === "login"
                ? "Sign in to continue to your dealership."
                : "Join the vehicle management platform today."}
            </p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
            >
              Register
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          {mode === "login" ? (
            <form
              onSubmit={handleLogin}
              className="auth-form"
            >
              <div className="form-group">
                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      email: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="login-password">
                    Password
                  </label>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() =>
                      alert(
                        "Password reset will be added later.",
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        password: event.target.value,
                      })
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}

                {!loading && <span>→</span>}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleRegister}
              className="auth-form"
            >
              <div className="form-group">
                <label htmlFor="register-name">
                  Full name
                </label>

                <input
                  id="register-name"
                  type="text"
                  placeholder="Your name"
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-email">
                  Email address
                </label>

                <input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      email: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-password">
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      password: event.target.value,
                    })
                  }
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-confirm-password">
                  Confirm password
                </label>

                <input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      confirmPassword: event.target.value,
                    })
                  }
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}

                {!loading && <span>→</span>}
              </button>
            </form>
          )}

          <p className="auth-footer">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "register"
                    : "login",
                );
                setError("");
                setSuccess("");
              }}
            >
              {mode === "login"
                ? "Create one"
                : "Sign in"}
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;