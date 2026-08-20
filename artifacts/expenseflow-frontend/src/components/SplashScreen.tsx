import { useEffect } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 1400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#2563eb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <img
        src="/icons/icon-192x192.png"
        alt="ExpenseFlow"
        style={{
          width: "96px",
          height: "96px",
          borderRadius: "20px",
          marginBottom: "18px",
          animation: "ef-splash-pulse 1.4s ease-in-out infinite",
        }}
      />
      <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.02em" }}>
        ExpenseFlow
      </h1>
      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", marginTop: "6px" }}>
        Smart business finance tracking
      </p>
      <style>{`
        @keyframes ef-splash-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
