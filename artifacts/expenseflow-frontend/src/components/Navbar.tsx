import { useLocation } from "wouter";

export default function Navbar() {
  const [, navigate] = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav style={{
      background: "#2563eb",
      color: "#fff",
      padding: "0 24px",
      height: "60px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 2px 8px rgba(37,99,235,0.15)",
    }}>
      <span style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>
        💸 ExpenseFlow
      </span>
      <button
        onClick={logout}
        style={{
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "6px",
          padding: "8px 18px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.9rem",
          transition: "background 0.15s",
        }}
        onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
        onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
      >
        Logout
      </button>
    </nav>
  );
}
