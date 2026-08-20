import { useState } from "react";

const SLIDES = [
  {
    emoji: "💳",
    title: "Track Every Transaction",
    description: "Log revenue, expenses, debts, and credits in just a few taps.",
  },
  {
    emoji: "📊",
    title: "See Your Business at a Glance",
    description: "Real-time totals for revenue, expenses, profit, debt, and credit — filtered by any period.",
  },
  {
    emoji: "✅",
    title: "Stay in Control",
    description: "Edit or delete any entry anytime, and mark debts and credits as settled as you go.",
  },
];

export default function Walkthrough({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        zIndex: 90,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px" }}>
        <button
          onClick={onFinish}
          style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "0.9rem", cursor: "pointer", fontWeight: 600 }}
        >
          Skip
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ fontSize: "4rem", marginBottom: "24px" }}>{slide.emoji}</div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: "12px" }}>
          {slide.title}
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#6b7280", textAlign: "center", maxWidth: "320px", lineHeight: 1.5 }}>
          {slide.description}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? "20px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: i === index ? "#2563eb" : "#e5e7eb",
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>

      <div style={{ padding: "0 24px 32px" }}>
        <button
          onClick={() => (isLast ? onFinish() : setIndex(index + 1))}
          style={{
            width: "100%",
            padding: "14px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
