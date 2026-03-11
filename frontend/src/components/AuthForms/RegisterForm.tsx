import { useState } from 'react';
import styles from './AuthForms.module.scss';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [FIO, setFIO] = useState('');
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
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ FIO, phone, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || 'Ошибка регистрации');
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
    <div className={styles['register-container']}>
      <div className={styles['register-main']}>
        <div className={styles.square}>
          <img src="/register_icon.png" alt="register" className={styles['register-picture']} />
        </div>

        <h2 className={styles['register-main-h2']}>Создать аккаунт</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles['input-stroke']}>
            <img src="/FIO.png" alt="fio" className={styles['input-icon']} />
            <input
              type="text"
              placeholder="Введите ФИО"
              value={FIO}
              onChange={(e) => setFIO(e.target.value)}
              required
            />
          </div>

          <div className={styles['input-stroke']}>
            <img src="/email.png" alt="email" className={styles['input-icon']} />
            <input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className={styles['input-stroke']}>
            <img src="/password.png" alt="password" className={styles['input-icon']} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Введите пароль"
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
              placeholder="Повторите пароль"
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

          {error && <p className={styles['error-message']}>{error}</p>}

          <button type="submit" className={styles['login-button']} disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles['register-link']}>
          Уже есть аккаунт?{' '}
          <button
            type="button"
            className={styles['switch-button']}
            onClick={onSwitchToLogin}
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;