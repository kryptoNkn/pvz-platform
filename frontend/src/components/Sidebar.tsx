import { useState } from "react";
import { BarChart2, ClipboardList, DollarSign, LogOut } from "lucide-react";

interface SidebarProps {
  active?: number;
  onLogout?: () => void;
}

const navItems = [
  { icon: <BarChart2 size={21} />, label: "Аналитика" },
  { icon: <ClipboardList size={21} />, label: "Отчёты" },
  { icon: <DollarSign size={21} />, label: "Финансы" },
];

export default function Sidebar({ active = 2, onLogout }: SidebarProps) {
  const [hov, setHov] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <aside style={{
        width: 72, minHeight: "100vh",
        background: "linear-gradient(180deg, #1c3d2b, #0d1f14)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingBottom: 20, boxShadow: "3px 0 24px rgba(0,0,0,.25)",
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          width: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", padding: "16px 0 18px",
          borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: "linear-gradient(135deg, #40c97e, #1a7a48)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(64,201,126,.45)", marginBottom: 6,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2.5" fill="white" fillOpacity=".95" />
              <rect x="13" y="2" width="9" height="9" rx="2.5" fill="white" fillOpacity=".5" />
              <rect x="2" y="13" width="9" height="9" rx="2.5" fill="white" fillOpacity=".5" />
              <rect x="13" y="13" width="9" height="9" rx="2.5" fill="white" fillOpacity=".95" />
            </svg>
          </div>
          <span style={{
            color: "rgba(255,255,255,.55)", fontSize: 8, fontWeight: 800,
            letterSpacing: 1.6, textTransform: "uppercase",
          }}>ПВЗ</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          {navItems.map((item, i) => {
            const isActive = active === i;
            const isHov = hov === i;
            return (
              <button
                key={i}
                title={item.label}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{
                  width: 48, height: 48, borderRadius: 13, border: "none",
                  background: isActive ? "rgba(64,201,126,.2)" : isHov ? "rgba(255,255,255,.07)" : "transparent",
                  color: isActive ? "#40c97e" : isHov ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.38)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all .15s",
                  boxShadow: isActive ? "inset 0 0 0 1.5px rgba(64,201,126,.4)" : "none",
                }}
              >
                {item.icon}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          title="Выйти"
          onClick={() => setShowConfirm(true)}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,60,60,.15)"; e.currentTarget.style.color = "#e06060"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.3)"; }}
          style={{
            width: 48, height: 48, borderRadius: 13, border: "none",
            background: "transparent", color: "rgba(255,255,255,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all .15s",
          }}
        >
          <LogOut size={21} />
        </button>
      </aside>

      {/* Logout confirmation modal */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "linear-gradient(160deg, #1c3d2b, #142d1f)",
              borderRadius: 20, padding: "32px 28px 28px",
              boxShadow: "0 20px 60px rgba(0,0,0,.5)",
              border: "1px solid rgba(64,201,126,.15)",
              width: 320, textAlign: "center",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(220,60,60,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
            }}>
              <LogOut size={24} color="#e06060" />
            </div>

            <h3 style={{ margin: "0 0 8px", color: "white", fontSize: 18, fontWeight: 700 }}>
              Выйти из аккаунта?
            </h3>
            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,.5)", fontSize: 14 }}>
              Вы уверены, что хотите выйти?
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid rgba(255,255,255,.12)",
                  background: "transparent", color: "rgba(255,255,255,.7)",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => { setShowConfirm(false); onLogout?.(); }}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #e05050, #b02020)",
                  color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(200,40,40,.4)",
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
