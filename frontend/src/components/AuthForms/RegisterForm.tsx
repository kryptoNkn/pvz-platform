import { useState } from 'react';
import {
  LockIcon,
  UserIcon,
  PhoneIcon,
  UserPlusIcon,
  EyeIcon,
} from './Icons';
import styles from './AuthForms.module.scss';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ full_name: name, phone, password }),
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
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <UserPlusIcon />
        </div>

        <h1 className={styles.title}>Создать Аккаунт</h1>

        <form
          onSubmit={handleSubmit}
          className={styles.form}
          style={{ marginTop: 24 }}
        >
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <UserIcon />
            </span>
            <input
              type="text"
              placeholder="ФИО"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <PhoneIcon />
            </span>
            <input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Повтор пароля"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Показать пароль"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className={styles.switchText}>
          Есть аккаунт?{' '}
          <button
            type="button"
            className={styles.switchLink}
            onClick={onSwitchToLogin}
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;