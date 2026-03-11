import { useState, useRef, useEffect } from "react";
import { Camera, Phone, User, Shield } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

interface ProfilePageProps {
  onLogout?: () => void;
}

export default function ProfilePage({ onLogout }: ProfilePageProps) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarHov, setAvatarHov] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/profile", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      })
      .catch(() => {});
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatar(ev.target?.result as string);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ background: "#f2fbf5", minHeight: "100vh" }}>
      <Sidebar active={2} onLogout={onLogout} />
      <div style={{ marginLeft: 72 }}>
        <Topbar title="ПВЗ Master" />
        <div style={{ padding: 32, paddingTop: 92, display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

          {/* Profile Card */}
          <div style={{
            background: "linear-gradient(160deg, #caeedd, #ddf4ea 55%, #edfaf4)",
            borderRadius: 22, padding: "32px 26px 30px",
            boxShadow: "0 6px 28px rgba(40,120,70,.13)",
            border: "1px solid rgba(40,140,80,.12)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Decorative blob */}
            <div style={{
              position: "absolute", top: -40, right: -40, width: 160, height: 160,
              borderRadius: "50%", background: "rgba(64,201,126,.1)", pointerEvents: "none",
            }} />

            {/* Avatar */}
            <div style={{ position: "relative", marginBottom: 22, width: "fit-content" }}>
              <div
                onClick={() => fileRef.current?.click()}
                onMouseEnter={() => setAvatarHov(true)}
                onMouseLeave={() => setAvatarHov(false)}
                style={{
                  width: 116, height: 116, borderRadius: "50%",
                  overflow: "hidden", cursor: "pointer", position: "relative",
                  boxShadow: avatarHov ? "0 6px 24px rgba(40,120,70,.35)" : "0 4px 18px rgba(40,120,70,.2)",
                  border: "3.5px solid rgba(255,255,255,.9)", transition: "box-shadow .2s",
                  background: "linear-gradient(135deg, #a8dfc0, #78c49a)",
                }}
              >
                {avatar
                  ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>👤</div>
                }
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "rgba(0,0,0,.42)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  opacity: avatarHov ? 1 : 0, transition: "opacity .2s",
                }}>
                  <Camera size={22} color="white" />
                  <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>Изменить</span>
                </div>
              </div>

              {/* + badge */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  position: "absolute", bottom: 2, right: 2, width: 28, height: 28,
                  borderRadius: "50%", background: "linear-gradient(135deg, #40c97e, #1a7a48)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 2px 10px rgba(40,160,80,.5)",
                  border: "2.5px solid white",
                }}
              >
                <span style={{ color: "white", fontSize: 17, lineHeight: 1, marginTop: -1 }}>+</span>
              </div>

              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />

              {saved && (
                <div style={{
                  position: "absolute", bottom: -38, left: "50%", transform: "translateX(-50%)",
                  background: "#1c3d2b", color: "white", borderRadius: 8,
                  padding: "5px 13px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                  boxShadow: "0 4px 12px rgba(0,0,0,.2)",
                }}>
                  ✓ Аватар обновлён
                </div>
              )}
            </div>

            <h2 style={{ margin: "0 0 10px", fontSize: 21, fontWeight: 700, color: "#1a3528" }}>
              Мой профиль
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
              <Shield size={13} color="#7aa88a" />
              <span style={{ color: "#5a7a66", fontSize: 13 }}>Уровень доступа:</span>
              <span style={{ color: "#cc2b2b", fontWeight: 800, fontSize: 13, letterSpacing: .8, textTransform: "uppercase" }}>
                Владелец
              </span>
            </div>

            <div style={{ width: "100%", height: 1, background: "rgba(0,0,0,.07)", marginBottom: 22 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { Icon: Phone, label: phone || "—" },
                { Icon: User, label: fullName || "—" },
              ].map(({ Icon, label }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "rgba(40,130,75,.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={15} color="#2a7a4a" />
                  </div>
                  <span style={{
                    color: "#1a3528", fontSize: 13.5, fontWeight: 600,
                    borderBottom: "1.5px dashed rgba(42,122,74,.35)", paddingBottom: 1,
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div style={{
            background: "linear-gradient(160deg, #edf8f2, #e4f6ec)",
            borderRadius: 22, minHeight: 420,
            border: "1.5px solid rgba(40,140,80,.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "rgba(40,120,70,.3)", fontSize: 14, fontWeight: 500 }}>
              Дополнительная информация
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}