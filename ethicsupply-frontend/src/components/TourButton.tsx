import React, { useState } from "react";

type Props = {
  isActive: boolean;
  onStart: () => void;
  onExit: () => void;
};

export function TourButton({ isActive, onStart, onExit }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={isActive ? onExit : onStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isActive ? "Exit guided tour (Esc)" : "Start guided tour — explains what every metric means"}
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 9999,
        background: isActive ? "#111111" : "#C8F05A",
        color: isActive ? "#C8F05A" : "#0A0A0A",
        border: isActive ? "1px solid rgba(200,240,90,0.4)" : "none",
        padding: "11px 20px",
        borderRadius: 4,
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "'Geist','Inter',system-ui,sans-serif",
        letterSpacing: "0.02em",
        boxShadow: isActive
          ? "0 4px 20px rgba(0,0,0,0.5)"
          : hovered
            ? "0 8px 40px rgba(200,240,90,0.45)"
            : "0 8px 32px rgba(200,240,90,0.28)",
        transform: hovered ? "scale(1.03)" : "scale(1)",
        transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
      }}
    >
      {isActive ? (
        <>
          <span style={{ fontSize: 15, lineHeight: 1 }}>✕</span>
          Exit Tour
        </>
      ) : (
        <>
          <span style={{ fontSize: 13, lineHeight: 1 }}>▶</span>
          Show me what matters
        </>
      )}
    </button>
  );
}
