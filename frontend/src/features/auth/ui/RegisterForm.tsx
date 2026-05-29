import { useState } from 'react';
import { useLang } from '@/shared/i18n';
import styles from './AuthForms.module.scss';
import Popup from './Popup';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: (role?: 'operator' | 'admin' | 'owner') => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { t } = useLang();
  const [full_name, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name, phone: cleanPhone, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || t.registrationError);
        return;
      }

      const data = await res.json().catch(() => null);
      onSuccess?.(data?.role ?? 'operator');
    } catch {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <Popup message={error} onClose={() => setError('')} />}
      <div className={styles['register-container']}>
        <div className={styles['register-main']}>
          <div className={styles.square}>
            <img src="/register_icon.png" alt="register" className={styles['register-picture']} />
          </div>

          <h2 className={styles['register-main-h2']}>{t.createAccount}</h2>

          <form onSubmit={handleSubmit}>
            <div className={styles['input-stroke']}>
              <img src="/FIO.png" alt="fio" className={styles['input-icon']} />
              <input
                type="text"
                placeholder={t.enterFullName}
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles['input-stroke']}>
              <img src="/phone-icon.png" alt="phone" className={styles['input-icon']} />
              <input
                type="tel"
                placeholder={t.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className={styles['input-stroke']}>
              <img src="/password.png" alt="password" className={styles['input-icon']} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.enterPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles['password-toggle']}
                onClick={() => setShowPassword(!showPassword)}
              >
                <img
                  src={showPassword ? '/eyeopen.png' : '/eyeclosed.png'}
                  alt="toggle"
                  className={styles['eye-icon']}
                />
              </button>
            </div>

            <div className={styles['input-stroke']}>
              <img src="/password.png" alt="password" className={styles['input-icon']} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles['password-toggle']}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <img
                  src={showConfirmPassword ? '/eyeopen.png' : '/eyeclosed.png'}
                  alt="toggle"
                  className={styles['eye-icon']}
                />
              </button>
            </div>

            <button type="submit" className={styles['login-button']} disabled={loading}>
              {loading ? t.registering : t.register}
            </button>
          </form>
          <div className={styles.line}></div>

          <div className={styles['register-link']}>
            {t.alreadyHaveAccount}{' '}
            <button
              type="button"
              className={styles['switch-button']}
              onClick={onSwitchToLogin}
            >
              {t.signIn}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;
