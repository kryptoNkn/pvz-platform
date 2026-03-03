import { Settings, Bell } from "lucide-react";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title = "ПВЗ Master" }: TopbarProps) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 72, right: 0, height: 60, zIndex: 99,
      background: "rgba(245,252,248,.92)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(40,120,70,.1)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px",
    }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: "#1c3d2b", letterSpacing: 0.4 }}>
        {title}
      </span>

      <div style={{ display: "flex", gap: 8 }}>
        {[<Settings size={18} />, <Bell size={18} />].map((icon, i) => (
          <button
            key={i}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #1c3d2b, #2d6043)",
              border: "none", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all .15s",
              boxShadow: "0 2px 8px rgba(28,61,43,.28)",
            }}
          >
            {icon}
          </button>
        ))}
      </div>
    </header>
  );
}