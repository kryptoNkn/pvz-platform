import { useState, useRef, useEffect } from 'react';
import { Camera, Phone, User, Shield, Lock, Calendar, Check, FileText, Upload, Trash2 } from 'lucide-react';
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
  const [companyName, setCompanyName] = useState('');
  const [inn, setInn] = useState('');
  const [kpp, setKpp] = useState('');
  const [ogrn, setOgrn] = useState('');
  const [bankName, setBankName] = useState('');
  const [bik, setBik] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [corrAccount, setCorrAccount] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
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

  const [reqStatus, setReqStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [reqError, setReqError] = useState('');

  const [documents, setDocuments] = useState<Array<{ id: string; filename: string; url: string; uploaded_at: string }>>([]);
  const [docStatus, setDocStatus] = useState<'idle' | 'uploading' | 'err'>('idle');
  const [docError, setDocError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

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
        setCompanyName(data.company_name ?? '');
        setInn(data.inn ?? '');
        setKpp(data.kpp ?? '');
        setOgrn(data.ogrn ?? '');
        setBankName(data.bank_name ?? '');
        setBik(data.bik ?? '');
        setBankAccount(data.bank_account ?? '');
        setCorrAccount(data.corr_account ?? '');
        setLegalAddress(data.legal_address ?? '');
      })
      .catch(() => {});

    fetch('/api/user/documents', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setDocuments(Array.isArray(data) ? data : []))
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

  const saveRequisites = async () => {
    if (reqStatus === 'saving') return;
    setReqStatus('saving');
    setReqError('');
    try {
      const res = await fetch('/api/user/requisites', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          inn,
          kpp,
          ogrn,
          bank_name: bankName,
          bik,
          bank_account: bankAccount,
          corr_account: corrAccount,
          legal_address: legalAddress,
        }),
      });
      if (res.ok) {
        setReqStatus('ok');
        setTimeout(() => setReqStatus('idle'), 2500);
      } else {
        setReqStatus('err');
        setReqError(t.saveError);
      }
    } catch {
      setReqStatus('err');
      setReqError(t.networkError);
    }
  };

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setDocStatus('uploading');
    setDocError('');
    const form = new FormData();
    form.append('document', file);
    try {
      const res = await fetch('/api/user/documents', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (res.ok) {
        const list = await fetch('/api/user/documents', { credentials: 'include' }).then(r => r.json());
        setDocuments(Array.isArray(list) ? list : []);
        setDocStatus('idle');
      } else {
        setDocStatus('err');
        setDocError(t.documentUploadError);
      }
    } catch {
      setDocStatus('err');
      setDocError(t.documentUploadError);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/user/documents/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        setDocStatus('err');
        setDocError(t.documentDeleteError);
      }
    } catch {
      setDocStatus('err');
      setDocError(t.documentDeleteError);
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

        {/* Requisites */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIconWrap}><Shield size={15} color="#2a7a4a" strokeWidth={2.5} /></div>
            <h3 className={styles.sectionTitle}>{t.requisitesTitle}</h3>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>{t.companyName}</label>
            <input
              className={styles.formInput}
              value={companyName}
              onChange={e => { setCompanyName(e.target.value); setReqStatus('idle'); }}
              placeholder={t.companyNamePlaceholder}
            />
          </div>

          <div className={styles.formRow3}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.inn}</label>
              <input
                className={styles.formInput}
                value={inn}
                onChange={e => { setInn(e.target.value); setReqStatus('idle'); }}
                placeholder="0000000000"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.kpp}</label>
              <input
                className={styles.formInput}
                value={kpp}
                onChange={e => { setKpp(e.target.value); setReqStatus('idle'); }}
                placeholder="000000000"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.ogrn}</label>
              <input
                className={styles.formInput}
                value={ogrn}
                onChange={e => { setOgrn(e.target.value); setReqStatus('idle'); }}
                placeholder="0000000000000"
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>{t.legalAddress}</label>
            <input
              className={styles.formInput}
              value={legalAddress}
              onChange={e => { setLegalAddress(e.target.value); setReqStatus('idle'); }}
              placeholder={t.legalAddressPlaceholder}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>{t.bankName}</label>
            <input
              className={styles.formInput}
              value={bankName}
              onChange={e => { setBankName(e.target.value); setReqStatus('idle'); }}
              placeholder={t.bankNamePlaceholder}
            />
          </div>

          <div className={styles.formRow3}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.bik}</label>
              <input
                className={styles.formInput}
                value={bik}
                onChange={e => { setBik(e.target.value); setReqStatus('idle'); }}
                placeholder="000000000"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.bankAccount}</label>
              <input
                className={styles.formInput}
                value={bankAccount}
                onChange={e => { setBankAccount(e.target.value); setReqStatus('idle'); }}
                placeholder="00000000000000000000"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>{t.corrAccount}</label>
              <input
                className={styles.formInput}
                value={corrAccount}
                onChange={e => { setCorrAccount(e.target.value); setReqStatus('idle'); }}
                placeholder="00000000000000000000"
              />
            </div>
          </div>

          {reqStatus === 'err' && <p className={styles.errMsg}>{reqError}</p>}
          {reqStatus === 'ok'  && (
            <p className={styles.okMsg}><Check size={13} strokeWidth={3} /> {t.requisitesSaved}</p>
          )}

          <button
            className={styles.saveBtn}
            onClick={saveRequisites}
            disabled={reqStatus === 'saving'}
          >
            {reqStatus === 'saving' ? t.saving : t.save}
          </button>
        </div>

        {/* Documents */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIconWrap}><FileText size={15} color="#2a7a4a" strokeWidth={2.5} /></div>
            <h3 className={styles.sectionTitle}>{t.documentsTitle}</h3>
          </div>

          <div className={styles.uploadRow}>
            <input
              ref={docRef}
              type="file"
              style={{ display: 'none' }}
              onChange={uploadDocument}
            />
            <button
              className={styles.uploadBtn}
              onClick={() => docRef.current?.click()}
              disabled={docStatus === 'uploading'}
            >
              <Upload size={14} strokeWidth={2.4} />
              {t.uploadDocument}
            </button>
          </div>

          {docStatus === 'err' && <p className={styles.errMsg}>{docError}</p>}

          <div className={styles.docsList}>
            {documents.length === 0 && (
              <div className={styles.docsEmpty}>{t.noDocuments}</div>
            )}
            {documents.map(doc => (
              <div key={doc.id} className={styles.docItem}>
                <div className={styles.docMeta}>
                  <span className={styles.docName}>{doc.filename}</span>
                  <span className={styles.docDate}>{doc.uploaded_at}</span>
                </div>
                <div className={styles.docActions}>
                  <a className={styles.docLink} href={doc.url} target="_blank" rel="noreferrer">{t.openDocument}</a>
                  <button className={styles.docDelete} onClick={() => deleteDocument(doc.id)}>
                    <Trash2 size={14} />
                    {t.deleteDocument}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
