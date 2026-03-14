import { useState, useRef, useEffect } from 'react';
import { Camera, Phone, User, Shield } from 'lucide-react';
import { Sidebar } from '@/widgets/sidebar';
import { Topbar } from '@/widgets/topbar';
import styles from './ProfilePage.module.scss';

interface ProfilePageProps {
  onLogout?: () => void;
}

export default function ProfilePage({ onLogout }: ProfilePageProps) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/user/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
      })
      .catch(() => {});
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result as string);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.page}>
      <Sidebar active={2} onLogout={onLogout} />

      <div className={styles.content}>
        <Topbar title="ПВЗ Master" />

        <div className={styles.grid}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.blob} />

            {/* Avatar */}
            <div className={styles.avatarWrap}>
              <div className={styles.avatar} onClick={() => fileRef.current?.click()}>
                {avatar
                  ? <img src={avatar} alt="avatar" className={styles.avatarImg} />
                  : <div className={styles.avatarPlaceholder}>👤</div>
                }
                <div className={styles.avatarOverlay}>
                  <Camera size={22} color="white" />
                  <span className={styles.avatarOverlayText}>Изменить</span>
                </div>
              </div>

              <div className={styles.avatarBadge} onClick={() => fileRef.current?.click()}>
                +
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />

              {saved && <div className={styles.savedToast}>✓ Аватар обновлён</div>}
            </div>

            <h2 className={styles.cardTitle}>Мой профиль</h2>

            <div className={styles.roleBadge}>
              <Shield size={13} color="#7aa88a" />
              <span className={styles.roleLabel}>Уровень доступа:</span>
              <span className={styles.roleValue}>Владелец</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.infoList}>
              {[
                { Icon: Phone, label: phone || '—' },
                { Icon: User, label: fullName || '—' },
              ].map(({ Icon, label }, i) => (
                <div key={i} className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <Icon size={15} color="#2a7a4a" />
                  </div>
                  <span className={styles.infoText}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className={styles.rightPanel}>
            <span className={styles.rightPanelText}>Дополнительная информация</span>
          </div>
        </div>
      </div>
    </div>
  );
}
