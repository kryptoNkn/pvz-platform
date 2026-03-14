import { useState } from 'react';
import logoImg from '@/shared/assets/logo.png';
import analyticsImg from '@/shared/assets/analytics.png';
import reportsImg from '@/shared/assets/reports.png';
import financeImg from '@/shared/assets/finance.png';
import logoutImg from '@/shared/assets/logout.png';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  active?: number;
  onLogout?: () => void;
}

const navItems = [
  { icon: analyticsImg, label: 'Аналитика' },
  { icon: reportsImg, label: 'Отчёты' },
  { icon: financeImg, label: 'Финансы' },
];

export default function Sidebar({ active = 2, onLogout }: SidebarProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <aside className={styles.aside}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrap}>
            <img src={logoImg} alt="Logo" className={styles.logoImg} />
          </div>
          <span className={styles.logoLabel}>ПВЗ Master</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item, i) => (
            <button
              key={i}
              title={item.label}
              className={[styles.navBtn, active === i ? styles.active : ''].filter(Boolean).join(' ')}
            >
              <img src={item.icon} alt={item.label} className={styles.navIcon} />
            </button>
          ))}
        </nav>

        <button
          title="Выйти"
          className={styles.logoutBtn}
          onClick={() => setShowConfirm(true)}
        >
          <img src={logoutImg} alt="Logout" className={styles.logoutIcon} />
        </button>
      </aside>

      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconWrap}>
              <img src={logoutImg} alt="Logout" className={styles.modalIcon} />
            </div>

            <h3 className={styles.modalTitle}>Выйти из аккаунта?</h3>
            <p className={styles.modalText}>Вы уверены, что хотите выйти?</p>

            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setShowConfirm(false)}>
                Отмена
              </button>
              <button
                className={styles.modalConfirmBtn}
                onClick={() => {
                  setShowConfirm(false);
                  onLogout?.();
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
