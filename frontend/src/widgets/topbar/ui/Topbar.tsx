import { Settings, Bell } from 'lucide-react';
import styles from './Topbar.module.scss';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title = 'ПВЗ Master' }: TopbarProps) {
  return (
    <header className={styles.header}>
      <span className={styles.title}>{title}</span>

      <div className={styles.actions}>
        <button className={styles.actionBtn}><Settings size={18} /></button>
        <button className={styles.actionBtn}><Bell size={18} /></button>
      </div>
    </header>
  );
}
