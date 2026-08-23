import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import {
  getVehicles,
  purchaseVehicle,
  type Vehicle,
} from "./vehicleApi";

type AuthMode = "login" | "register";

type AuthResponse = {
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  const [user, setUser] = useState<AuthResponse["user"] | null>(null);

  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);

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

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const [search, setSearch] = useState({
    make: "",
    model: "",
    category: "",
    minPrice: "",
    maxPrice: "",
  });

  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(
    null,
  );

  async function loadVehicles() {
    setLoadingVehicles(true);
    setVehicleError("");

    try {
      const response = await getVehicles({
        make: search.make,
        model: search.model,
        category: search.category,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
      });

      setVehicles(response.data);
    } catch (error) {
      setVehicleError(
        error instanceof Error
          ? error.message
          : "Unable to load vehicles.",
      );
    } finally {
      setLoadingVehicles(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadVehicles();
    }
  }, [token]);

  const availableVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status !== "SOLD"),
    [vehicles],
  );

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      if (!response.token) {
        throw new Error("Login token was not returned.");
      }

      localStorage.setItem("token", response.token);
      setToken(response.token);
      setUser(response.user ?? null);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Login failed.",
      );
    }
  }

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await apiRequest<AuthResponse>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: registerForm.name,
            email: registerForm.email,
            password: registerForm.password,
          }),
        },
      );

      alert(response.message ?? "Account created successfully.");

      setMode("login");

      setLoginForm({
        email: registerForm.email,
        password: "",
      });

      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Registration failed.",
      );
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setVehicles([]);
  }

  async function handlePurchase(vehicleId: string) {
    setPurchaseLoading(vehicleId);

    try {
      const response = await purchaseVehicle(vehicleId);

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === vehicleId
            ? response.data
            : vehicle,
        ),
      );

      alert("Vehicle purchased successfully.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Purchase failed.",
      );
    } finally {
      setPurchaseLoading(null);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-background">
          <div className="background-glow glow-one" />
          <div className="background-glow glow-two" />
        </div>

        <main className="auth-container">
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
                Manage vehicles, dealerships and inventory from
                one powerful platform.
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

            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => setMode("login")}
              >
                Sign In
              </button>

              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </div>

            {mode === "login" ? (
              <form
                onSubmit={handleLogin}
                className="auth-form"
              >
                <div className="form-group">
                  <label htmlFor="login-email">
                    Gmail address
                  </label>

                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@gmail.com"
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
                  <label htmlFor="login-password">
                    Password
                  </label>

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
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Sign in <span>→</span>
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
                    Gmail address
                  </label>

                  <input
                    id="register-email"
                    type="email"
                    placeholder="you@gmail.com"
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
                >
                  Create account <span>→</span>
                </button>
              </form>
            )}

            <p className="auth-footer">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() =>
                  setMode(
                    mode === "login"
                      ? "register"
                      : "login",
                  )
                }
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-logo">🚗</div>
          <div>
            <h1>Car Dealership</h1>
            <p>Vehicle Inventory</p>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-title">
          <div>
            <p className="dashboard-label">
              PREMIUM INVENTORY
            </p>
            <h2>Find your perfect vehicle.</h2>
            <p>
              Browse our available vehicles and find your next
              ride.
            </p>
          </div>
        </section>

        <section className="filters">
          <div className="filter-group">
            <label>Make</label>
            <input
              placeholder="Toyota"
              value={search.make}
              onChange={(event) =>
                setSearch({
                  ...search,
                  make: event.target.value,
                })
              }
            />
          </div>

          <div className="filter-group">
            <label>Model</label>
            <input
              placeholder="Camry"
              value={search.model}
              onChange={(event) =>
                setSearch({
                  ...search,
                  model: event.target.value,
                })
              }
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <input
              placeholder="Sedan"
              value={search.category}
              onChange={(event) =>
                setSearch({
                  ...search,
                  category: event.target.value,
                })
              }
            />
          </div>

          <div className="filter-group">
            <label>Min price</label>
            <input
              type="number"
              placeholder="0"
              value={search.minPrice}
              onChange={(event) =>
                setSearch({
                  ...search,
                  minPrice: event.target.value,
                })
              }
            />
          </div>

          <div className="filter-group">
            <label>Max price</label>
            <input
              type="number"
              placeholder="100000"
              value={search.maxPrice}
              onChange={(event) =>
                setSearch({
                  ...search,
                  maxPrice: event.target.value,
                })
              }
            />
          </div>

          <button
            type="button"
            className="search-button"
            onClick={loadVehicles}
          >
            Search
          </button>
        </section>

        {loadingVehicles && (
          <div className="status-message">
            Loading vehicles...
          </div>
        )}

        {vehicleError && (
          <div className="error-message">
            {vehicleError}
          </div>
        )}

        {!loadingVehicles &&
          !vehicleError &&
          availableVehicles.length === 0 && (
            <div className="status-message">
              No vehicles found.
            </div>
          )}

        <section className="vehicle-grid">
          {availableVehicles.map((vehicle) => {
            const price = Number(vehicle.price);
            const soldOut = vehicle.quantity <= 0;

            return (
              <article
                className="vehicle-card"
                key={vehicle.id}
              >
                <div className="vehicle-image">
                  🚘
                </div>

                <div className="vehicle-card-content">
                  <div className="vehicle-category">
                    {vehicle.category}
                  </div>

                  <h3>
                    {vehicle.make} {vehicle.model}
                  </h3>

                  <p className="vehicle-details">
                    {vehicle.year}
                    {vehicle.mileage != null
                      ? ` • ${vehicle.mileage.toLocaleString()} km`
                      : ""}
                  </p>

                  <div className="vehicle-bottom">
                    <div>
                      <strong>
                        ₹{price.toLocaleString("en-IN")}
                      </strong>

                      <span
                        className={
                          soldOut
                            ? "stock sold-out"
                            : "stock"
                        }
                      >
                        {soldOut
                          ? "Out of stock"
                          : `${vehicle.quantity} in stock`}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="purchase-button"
                      disabled={
                        soldOut ||
                        purchaseLoading === vehicle.id
                      }
                      onClick={() =>
                        handlePurchase(vehicle.id)
                      }
                    >
                      {purchaseLoading === vehicle.id
                        ? "Purchasing..."
                        : soldOut
                          ? "Sold out"
                          : "Purchase"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default App;