import { useState, useRef, useEffect } from 'react';
import { Camera, Phone, User, Shield, Lock, Calendar, Check } from 'lucide-react';
import { useLang } from '@/shared/i18n';
import styles from './ProfilePage.module.scss';

const ROLE_COLORS: Record<string, string> = {
  owner:    '#c0392b',
  admin:    '#2563eb',
  operator: '#d97706',
  pending:  '#6b7280',
  user:     '#16a34a',
};

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

export default function ProfilePage() {
  const { t } = useLang();

  const ROLE_LABELS: Record<string, string> = {
    owner:    t.roleOwnerLabel,
    admin:    t.roleAdminLabel,
    operator: t.roleOperatorLabel,
    pending:  t.rolePendingLabel,
    user:     t.roleUserLabel,
  };

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(t.locale, {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarToast, setAvatarToast] = useState<'ok' | 'err' | null>(null);

  const [editName, setEditName] = useState('');
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [nameError, setNameError] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [pwdError, setPwdError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/user/profile', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        setFullName(data.full_name ?? '');
        setEditName(data.full_name ?? '');
        setPhone(data.phone ?? '');
        setRole(data.role ?? '');
        setCreatedAt(data.created_at ?? '');
        setAvatarUrl(data.avatar_url ?? null);
      })
      .catch(() => {});
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    const form = new FormData();
    form.append('avatar', file);
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatar_url + '?t=' + Date.now());
        setAvatarToast('ok');
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      } else {
        setAvatarToast('err');
      }
    } catch {
      setAvatarToast('err');
    } finally {
      setUploading(false);
      setTimeout(() => setAvatarToast(null), 2500);
    }
  };

  const saveName = async () => {
    if (!editName.trim() || nameStatus === 'saving') return;
    setNameStatus('saving');
    setNameError('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: editName }),
      });
      if (res.ok) {
        setFullName(editName);
        setNameStatus('ok');
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        setTimeout(() => setNameStatus('idle'), 2500);
      } else {
        setNameStatus('err');
        setNameError(t.saveError);
      }
    } catch {
      setNameStatus('err');
      setNameError(t.networkError);
    }
  };

  const changePassword = async () => {
    setNameError('');
    if (newPwd !== confirmPwd) {
      setPwdStatus('err');
      setPwdError(t.passwordMismatch);
      return;
    }
    if (newPwd.length < 8) {
      setPwdStatus('err');
      setPwdError(t.passwordTooShort);
      return;
    }
    if (pwdStatus === 'saving') return;
    setPwdStatus('saving');
    setPwdError('');
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdStatus('ok');
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setTimeout(() => setPwdStatus('idle'), 2500);
      } else {
        setPwdStatus('err');
        setPwdError(data.error ?? t.saveError);
      }
    } catch {
      setPwdStatus('err');
      setPwdError(t.networkError);
    }
  };

  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? '#16a34a';
  const initials  = getInitials(fullName);

  return (
    <div className={styles.grid}>
      {/* ── Left card ── */}
      <div className={styles.profileCard}>
        <div className={styles.blob} />
        <div className={styles.blob2} />

        <div className={styles.avatarWrap}>
          <div
            className={`${styles.avatar} ${uploading ? styles.avatarLoading : ''}`}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
              : <div className={styles.avatarInitials}>{initials || '?'}</div>
            }
            <div className={styles.avatarOverlay}>
              {uploading
                ? <div className={styles.spinner} />
                : <>
                    <Camera size={20} color="white" strokeWidth={2.5} />
                    <span className={styles.avatarOverlayText}>{t.changeAvatar}</span>
                  </>
              }
            </div>
          </div>

          <div className={styles.avatarBadge} onClick={() => !uploading && fileRef.current?.click()}>
            <Camera size={11} color="white" strokeWidth={3} />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />

          {avatarToast === 'ok'  && <div className={styles.toast}>{t.avatarUpdated}</div>}
          {avatarToast === 'err' && <div className={`${styles.toast} ${styles.toastErr}`}>{t.avatarError}</div>}
        </div>

        <h2 className={styles.cardName}>{fullName || '—'}</h2>

        <div className={styles.roleBadge} style={{ '--role-color': roleColor } as React.CSSProperties}>
          <Shield size={12} strokeWidth={2.5} />
          <span>{roleLabel}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><Phone size={14} color="#2a7a4a" strokeWidth={2.5} /></div>
            <div className={styles.infoDetails}>
              <span className={styles.infoLabel}>{t.phoneLabel}</span>
              <span className={styles.infoText}>{phone ? `+${phone}` : '—'}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><Calendar size={14} color="#2a7a4a" strokeWidth={2.5} /></div>
            <div className={styles.infoDetails}>
              <span className={styles.infoLabel}>{t.memberSince}</span>
              <span className={styles.infoText}>{createdAt ? formatDate(createdAt) : '—'}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><User size={14} color="#2a7a4a" strokeWidth={2.5} /></div>
            <div className={styles.infoDetails}>
              <span className={styles.infoLabel}>{t.roleLabel}</span>
              <span className={styles.infoText} style={{ color: roleColor }}>{roleLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={styles.rightPanel}>
        {/* Edit profile */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIconWrap}><User size={15} color="#2a7a4a" strokeWidth={2.5} /></div>
            <h3 className={styles.sectionTitle}>{t.editProfile}</h3>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>{t.fullName}</label>
            <input
              className={styles.formInput}
              value={editName}
              onChange={e => { setEditName(e.target.value); setNameStatus('idle'); }}
              placeholder={t.fullNamePlaceholder}
            />
          </div>

          {nameStatus === 'err' && <p className={styles.errMsg}>{nameError}</p>}
          {nameStatus === 'ok'  && (
            <p className={styles.okMsg}><Check size={13} strokeWidth={3} /> {t.saved}</p>
          )}

          <button
            className={styles.saveBtn}
            onClick={saveName}
            disabled={nameStatus === 'saving' || !editName.trim() || editName === fullName}
          >
            {nameStatus === 'saving' ? t.saving : t.save}
          </button>
        </div>

        {/* Change password */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIconWrap}><Lock size={15} color="#2a7a4a" strokeWidth={2.5} /></div>
            <h3 className={styles.sectionTitle}>{t.security}</h3>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>{t.currentPassword}</label>
            <input
              className={styles.formInput}
              type="password"
              value={currentPwd}
              onChange={e => { setCurrentPwd(e.target.value); setPwdStatus('idle'); }}
              placeholder="••••••••"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.newPassword}</label>
              <input
                className={styles.formInput}
                type="password"
                value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setPwdStatus('idle'); }}
                placeholder="••••••••"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.confirmPasswordLabel}</label>
              <input
                className={`${styles.formInput}${confirmPwd && newPwd !== confirmPwd ? ' ' + styles.formInputErr : ''}`}
                type="password"
                value={confirmPwd}
                onChange={e => { setConfirmPwd(e.target.value); setPwdStatus('idle'); }}
                placeholder="••••••••"
              />
            </div>
          </div>

          {pwdStatus === 'err' && <p className={styles.errMsg}>{pwdError}</p>}
          {pwdStatus === 'ok'  && (
            <p className={styles.okMsg}><Check size={13} strokeWidth={3} /> {t.passwordChanged}</p>
          )}

          <button
            className={`${styles.saveBtn} ${styles.saveBtnBlue}`}
            onClick={changePassword}
            disabled={pwdStatus === 'saving' || !currentPwd || !newPwd || !confirmPwd}
          >
            {pwdStatus === 'saving' ? t.changing : t.changePassword}
          </button>
        </div>
      </div>
    </div>
  );
}
