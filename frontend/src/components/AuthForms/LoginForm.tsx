import { useState } from 'react';
import styles from './AuthForms.module.scss';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || 'Неверный номер телефона или пароль');
        return;
      }

      onSuccess?.();
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['login-container']}>
      <div className={styles['login-main']}>
        <div className={styles.square}>
          <img src='/enter_icon.png' alt='vxod' className={styles['enter-picture']} />
        </div>

        <h2 className={styles['login-main-h2']}>Добро пожаловать!</h2>
        <p className={styles.subtitle}>Войдите в свой аккаунт</p>

        <form onSubmit={handleSubmit}>
          <div className={styles['input-stroke']}>
            <img src='/phone-icon.png' alt='phone' className={styles['input-icon']} />
            <input
              type='tel'
              placeholder='Телефон'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className={styles['input-stroke']}>
            <img src='/password.png' alt='password' className={styles['input-icon']} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder='Пароль'
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

          {error && <p className={styles['error-message']}>{error}</p>}

          <button type='submit' className={styles['login-button']} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className={styles['register-link']}>
          Нет аккаунта?{' '}
          <button
            type="button"
            className={styles['switch-button']}
            onClick={onSwitchToRegister}
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;