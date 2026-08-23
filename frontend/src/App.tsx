import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import {
  getVehicles,
  purchaseVehicle,
  type Vehicle,
} from "./vehicleApi";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  restockVehicle,
  type CreateVehicleInput,
} from "./adminVehicleApi";

type AuthMode = "login" | "register";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthResponse = {
  message?: string;
  token?: string;
  user?: AuthUser;
};

const emptyVehicleForm = (): CreateVehicleInput => ({
  vin: "",
  make: "",
  model: "",
  category: "",
  year: new Date().getFullYear(),
  mileage: 0,
  price: 0,
  quantity: 1,
  status: "AVAILABLE",
});

function getUserFromToken(token: string | null): AuthUser | null {
  if (!token) return null;

  try {
    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/"),
      ),
    );

    if (!payload.userId || !payload.role) {
      return null;
    }

    return {
      id: String(payload.userId),
      name: "",
      email: "",
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  const [user, setUser] = useState<AuthUser | null>(() =>
    getUserFromToken(localStorage.getItem("token")),
  );

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] =
    useState({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [loadingVehicles, setLoadingVehicles] =
    useState(false);

  const [vehicleError, setVehicleError] =
    useState("");

  const [search, setSearch] = useState({
    make: "",
    model: "",
    category: "",
    minPrice: "",
    maxPrice: "",
  });

  const [purchaseLoading, setPurchaseLoading] =
    useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const [adminLoading, setAdminLoading] =
    useState(false);

  const [adminError, setAdminError] =
    useState("");

  const [showAddVehicle, setShowAddVehicle] =
    useState(false);

  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null);

  const [restockingVehicle, setRestockingVehicle] =
    useState<Vehicle | null>(null);

  const [vehicleForm, setVehicleForm] =
    useState<CreateVehicleInput>(
      emptyVehicleForm(),
    );

  const [restockQuantity, setRestockQuantity] =
    useState(1);

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
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.status !== "SOLD",
      ),
    [vehicles],
  );

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      const response =
        await apiRequest<AuthResponse>(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify(loginForm),
          },
        );

      if (!response.token) {
        throw new Error(
          "Login token was not returned.",
        );
      }

      localStorage.setItem(
        "token",
        response.token,
      );

      setToken(response.token);

      setUser(
        response.user ??
          getUserFromToken(response.token),
      );
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

    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response =
        await apiRequest<AuthResponse>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              name: registerForm.name,
              email: registerForm.email,
              password:
                registerForm.password,
            }),
          },
        );

      alert(
        response.message ??
          "Account created successfully.",
      );

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

  async function handlePurchase(
    vehicleId: string,
  ) {
    setPurchaseLoading(vehicleId);

    try {
      const response =
        await purchaseVehicle(vehicleId);

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === vehicleId
            ? response.data
            : vehicle,
        ),
      );

      alert(
        "Vehicle purchased successfully.",
      );
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

  async function handleCreateVehicle(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setAdminLoading(true);
    setAdminError("");

    try {
      const response =
        await createVehicle(vehicleForm);

      setVehicles((current) => [
        response.data,
        ...current,
      ]);

      setShowAddVehicle(false);

      setVehicleForm(
        emptyVehicleForm(),
      );
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Unable to create vehicle.",
      );
    } finally {
      setAdminLoading(false);
    }
  }

  function startEditing(
    vehicle: Vehicle,
  ) {
    setAdminError("");

    setEditingVehicle(vehicle);

    setVehicleForm({
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category,
      year: vehicle.year,
      mileage: vehicle.mileage ?? 0,
      price: Number(vehicle.price),
      quantity: vehicle.quantity,
      status: vehicle.status,
    });
  }

  async function handleUpdateVehicle(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingVehicle) {
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const response =
        await updateVehicle(
          editingVehicle.id,
          vehicleForm,
        );

      setVehicles((current) =>
        current.map((vehicle) =>
          vehicle.id === response.data.id
            ? response.data
            : vehicle,
        ),
      );

      setEditingVehicle(null);
      setVehicleForm(
        emptyVehicleForm(),
      );
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Unable to update vehicle.",
      );
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDeleteVehicle(
    vehicleId: string,
  ) {
    if (
      !window.confirm(
        "Are you sure you want to delete this vehicle?",
      )
    ) {
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      await deleteVehicle(vehicleId);

      setVehicles((current) =>
        current.filter(
          (vehicle) =>
            vehicle.id !== vehicleId,
        ),
      );
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Unable to delete vehicle.",
      );
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleRestockVehicle(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !restockingVehicle ||
      restockQuantity <= 0
    ) {
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const response =
        await restockVehicle(
          restockingVehicle.id,
          restockQuantity,
        );

      setVehicles((current) =>
        current.map((vehicle) =>
          vehicle.id === response.data.id
            ? response.data
            : vehicle,
        ),
      );

      setRestockingVehicle(null);
      setRestockQuantity(1);
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Unable to restock vehicle.",
      );
    } finally {
      setAdminLoading(false);
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
              <div className="brand-icon">
                🚗
              </div>

              <p className="brand-label">
                PREMIUM VEHICLE MANAGEMENT
              </p>

              <h1>
                Find your
                <span>
                  {" "}
                  perfect ride.
                </span>
              </h1>

              <p className="brand-description">
                Manage vehicles,
                dealerships and inventory
                from one powerful platform.
              </p>

              <div className="brand-features">
                <div className="feature">
                  <div className="feature-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Smart inventory
                    </strong>

                    <p>
                      Keep every vehicle
                      organized.
                    </p>
                  </div>
                </div>

                <div className="feature">
                  <div className="feature-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Easy management
                    </strong>

                    <p>
                      Manage your dealership
                      effortlessly.
                    </p>
                  </div>
                </div>

                <div className="feature">
                  <div className="feature-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Secure access
                    </strong>

                    <p>
                      Role-based access for
                      your team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-card">
            <div className="auth-header">
              <div className="mobile-brand-icon">
                🚗
              </div>

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
                className={
                  mode === "login"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMode("login")
                }
              >
                Sign In
              </button>

              <button
                type="button"
                className={
                  mode === "register"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMode("register")
                }
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
                    value={
                      loginForm.email
                    }
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        email:
                          event.target
                            .value,
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
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your password"
                      value={
                        loginForm.password
                      }
                      onChange={(event) =>
                        setLoginForm({
                          ...loginForm,
                          password:
                            event.target
                              .value,
                        })
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          !showPassword,
                        )
                      }
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Sign in{" "}
                  <span>→</span>
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
                    value={
                      registerForm.name
                    }
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        name:
                          event.target
                            .value,
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
                    value={
                      registerForm.email
                    }
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        email:
                          event.target
                            .value,
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
                    value={
                      registerForm.password
                    }
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        password:
                          event.target
                            .value,
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
                    value={
                      registerForm.confirmPassword
                    }
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword:
                          event.target
                            .value,
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
                  Create account{" "}
                  <span>→</span>
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
          <div className="dashboard-logo">
            🚗
          </div>

          <div>
            <h1>Car Dealership</h1>
            <p>Vehicle Inventory</p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {isAdmin && (
            <span
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background:
                  "rgba(124, 58, 237, 0.18)",
                border:
                  "1px solid rgba(167, 139, 250, 0.3)",
                color: "#c4b5fd",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ADMIN
            </span>
          )}

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-title">
          <div>
            <p className="dashboard-label">
              {isAdmin
                ? "ADMIN INVENTORY"
                : "PREMIUM INVENTORY"}
            </p>

            <h2>
              Find your perfect vehicle.
            </h2>

            <p>
              {isAdmin
                ? "Manage your dealership inventory and vehicles."
                : "Browse our available vehicles and find your next ride."}
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="primary-button"
              style={{
                width: "auto",
                minWidth: 150,
              }}
              onClick={() => {
                setAdminError("");
                setEditingVehicle(null);
                setVehicleForm(
                  emptyVehicleForm(),
                );
                setShowAddVehicle(true);
              }}
            >
              + Add Vehicle
            </button>
          )}
        </section>

        {adminError && (
          <div
            className="error-message"
            style={{ marginBottom: 18 }}
          >
            {adminError}
          </div>
        )}

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
                  model:
                    event.target.value,
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
                  category:
                    event.target.value,
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
                  minPrice:
                    event.target.value,
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
                  maxPrice:
                    event.target.value,
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
          availableVehicles.length ===
            0 && (
            <div className="status-message">
              No vehicles found.
            </div>
          )}

        <section className="vehicle-grid">
          {availableVehicles.map(
            (vehicle) => {
              const price = Number(
                vehicle.price,
              );

              const soldOut =
                vehicle.quantity <= 0;

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
                      {vehicle.make}{" "}
                      {vehicle.model}
                    </h3>

                    <p className="vehicle-details">
                      {vehicle.year}

                      {vehicle.mileage !=
                      null
                        ? ` • ${vehicle.mileage.toLocaleString()} km`
                        : ""}
                    </p>

                    <div className="vehicle-bottom">
                      <div>
                        <strong>
                          ₹
                          {price.toLocaleString(
                            "en-IN",
                          )}
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
                          purchaseLoading ===
                            vehicle.id
                        }
                        onClick={() =>
                          handlePurchase(
                            vehicle.id,
                          )
                        }
                      >
                        {purchaseLoading ===
                        vehicle.id
                          ? "Purchasing..."
                          : soldOut
                            ? "Sold out"
                            : "Purchase"}
                      </button>
                    </div>

                    {isAdmin && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: 8,
                          marginTop: 14,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(
                              vehicle,
                            )
                          }
                          disabled={
                            adminLoading
                          }
                          style={{
                            padding:
                              "9px 10px",
                            borderRadius: 8,
                            border:
                              "1px solid #334155",
                            background:
                              "#172033",
                            color:
                              "#e2e8f0",
                            fontWeight: 600,
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRestockingVehicle(
                              vehicle,
                            );

                            setRestockQuantity(
                              1,
                            );

                            setAdminError(
                              "",
                            );
                          }}
                          disabled={
                            adminLoading
                          }
                          style={{
                            padding:
                              "9px 10px",
                            borderRadius: 8,
                            border:
                              "1px solid #334155",
                            background:
                              "#172033",
                            color:
                              "#e2e8f0",
                            fontWeight: 600,
                          }}
                        >
                          Restock
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteVehicle(
                              vehicle.id,
                            )
                          }
                          disabled={
                            adminLoading
                          }
                          style={{
                            gridColumn:
                              "1 / -1",
                            padding:
                              "9px 10px",
                            borderRadius: 8,
                            border:
                              "1px solid rgba(248, 113, 113, 0.35)",
                            background:
                              "rgba(127, 29, 29, 0.2)",
                            color:
                              "#fca5a5",
                            fontWeight: 600,
                          }}
                        >
                          Delete Vehicle
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </section>
      </main>

      {(showAddVehicle ||
        editingVehicle) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            padding: 20,
            background:
              "rgba(0, 0, 0, 0.72)",
          }}
        >
          <div
            style={{
              width:
                "min(620px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              borderRadius: 18,
              border:
                "1px solid rgba(148, 163, 184, 0.18)",
              background:
                "#0f172a",
              boxShadow:
                "0 30px 80px rgba(0,0,0,.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                {editingVehicle
                  ? "Edit Vehicle"
                  : "Add Vehicle"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowAddVehicle(
                    false,
                  );

                  setEditingVehicle(
                    null,
                  );

                  setAdminError("");
                }}
                style={{
                  border: "none",
                  background:
                    "transparent",
                  color:
                    "#94a3b8",
                  fontSize: 22,
                }}
              >
                ×
              </button>
            </div>

            {adminError && (
              <div
                className="error-message"
                style={{
                  marginBottom: 16,
                }}
              >
                {adminError}
              </div>
            )}

            <form
              onSubmit={
                editingVehicle
                  ? handleUpdateVehicle
                  : handleCreateVehicle
              }
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 14,
              }}
            >
              <div className="form-group">
                <label>VIN</label>

                <input
                  required
                  value={
                    vehicleForm.vin
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vin: e.target
                        .value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Make</label>

                <input
                  required
                  value={
                    vehicleForm.make
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      make: e.target
                        .value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Model</label>

                <input
                  required
                  value={
                    vehicleForm.model
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      model:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Category</label>

                <input
                  required
                  placeholder="Sedan"
                  value={
                    vehicleForm.category
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      category:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Year</label>

                <input
                  required
                  type="number"
                  value={
                    vehicleForm.year
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      year: Number(
                        e.target.value,
                      ),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Mileage</label>

                <input
                  type="number"
                  min="0"
                  value={
                    vehicleForm.mileage ??
                    0
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      mileage:
                        Number(
                          e.target
                            .value,
                        ),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Price</label>

                <input
                  required
                  type="number"
                  min="0"
                  value={
                    vehicleForm.price
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      price: Number(
                        e.target.value,
                      ),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>

                <input
                  required
                  type="number"
                  min="0"
                  value={
                    vehicleForm.quantity
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      quantity:
                        Number(
                          e.target
                            .value,
                        ),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
                  value={
                    vehicleForm.status
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      status:
                        e.target
                          .value as CreateVehicleInput["status"],
                    })
                  }
                  style={{
                    width: "100%",
                    padding:
                      "13px 14px",
                    border:
                      "1px solid #243047",
                    borderRadius: 9,
                    outline:
                      "none",
                    color:
                      "#f8fafc",
                    background:
                      "#0b1220",
                  }}
                >
                  <option value="AVAILABLE">
                    AVAILABLE
                  </option>

                  <option value="SOLD">
                    SOLD
                  </option>

                  <option value="MAINTENANCE">
                    MAINTENANCE
                  </option>
                </select>
              </div>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                  display: "flex",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    adminLoading
                  }
                >
                  {adminLoading
                    ? "Saving..."
                    : editingVehicle
                      ? "Save Changes"
                      : "Create Vehicle"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddVehicle(
                      false,
                    );

                    setEditingVehicle(
                      null,
                    );

                    setAdminError("");
                  }}
                  disabled={
                    adminLoading
                  }
                  style={{
                    width: "100%",
                    border:
                      "1px solid #334155",
                    borderRadius: 9,
                    background:
                      "#172033",
                    color:
                      "#e2e8f0",
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restockingVehicle && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: 20,
            background:
              "rgba(0, 0, 0, 0.72)",
          }}
        >
          <div
            style={{
              width:
                "min(420px, 100%)",
              padding: 28,
              borderRadius: 18,
              border:
                "1px solid rgba(148, 163, 184, 0.18)",
              background:
                "#0f172a",
              boxShadow:
                "0 30px 80px rgba(0,0,0,.5)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Restock Vehicle
            </h2>

            <p
              style={{
                color: "#94a3b8",
              }}
            >
              {
                restockingVehicle.make
              }{" "}
              {
                restockingVehicle.model
              }
              {" • "}
              Current stock:{" "}
              {
                restockingVehicle.quantity
              }
            </p>

            {adminError && (
              <div
                className="error-message"
                style={{
                  marginBottom: 16,
                }}
              >
                {adminError}
              </div>
            )}

            <form
              onSubmit={
                handleRestockVehicle
              }
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 14,
              }}
            >
              <div className="form-group">
                <label>
                  Quantity to add
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={
                    restockQuantity
                  }
                  onChange={(e) =>
                    setRestockQuantity(
                      Number(
                        e.target.value,
                      ),
                    )
                  }
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  adminLoading
                }
              >
                {adminLoading
                  ? "Restocking..."
                  : "Restock Vehicle"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestockingVehicle(
                    null,
                  );

                  setRestockQuantity(
                    1,
                  );

                  setAdminError("");
                }}
                disabled={
                  adminLoading
                }
                style={{
                  padding: "12px",
                  border:
                    "1px solid #334155",
                  borderRadius: 9,
                  background:
                    "#172033",
                  color:
                    "#e2e8f0",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;