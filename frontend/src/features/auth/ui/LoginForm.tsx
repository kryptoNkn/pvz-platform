import { useState } from 'react';
import { useLang } from '@/shared/i18n';
import styles from './AuthForms.module.scss';
import Popup from './Popup';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { t } = useLang();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: cleanPhone, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || t.loginError);
        return;
      }

      onSuccess?.();
    } catch {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <Popup message={error} onClose={() => setError('')} />}
      <div className={styles['login-container']}>
        <div className={styles['login-main']}>
          <div className={styles.square}>
            <img src="/register_icon.png" alt="login" className={styles['login-picture']} />
          </div>

          <h2>{t.welcome}</h2>
          <p className={styles.subtitle}>{t.signInToAccount}</p>

          <form onSubmit={handleSubmit}>
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
                placeholder={t.password}
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

            <button type="submit" className={styles['login-button']} disabled={loading}>
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>
          <div className={styles.line}></div>

          <div className={styles['register-link']}>
            {t.noAccount}{' '}
            <button
              type="button"
              className={styles['switch-button']}
              onClick={onSwitchToRegister}
            >
              {t.register}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
