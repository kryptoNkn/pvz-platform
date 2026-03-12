import { useState } from 'react';
import styles from './AuthForms.module.scss';
import Popup from './Popup';
interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
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
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const payload = {
      full_name,
      phone: cleanPhone,
      password,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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
    <>
      {error && <Popup message={error} onClose={() => setError('')} />}
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
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles['input-stroke']}>
            <img src="/phone-icon.png" alt="phone" className={styles['input-icon']} />
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
    </>
  );
};

export default RegisterForm;