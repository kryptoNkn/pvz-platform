import { useState } from 'react';
import { LoginForm, RegisterForm } from '@/features/auth';
import { ProfilePage } from '@/pages/profile';

type View = 'login' | 'register' | 'profile';

export default function App() {
  const [view, setView] = useState<View>('login');

  if (view === 'profile') {
    return <ProfilePage onLogout={() => setView('login')} />;
  }

  return view === 'login' ? (
    <LoginForm
      onSwitchToRegister={() => setView('register')}
      onSuccess={() => setView('profile')}
    />
  ) : (
    <RegisterForm
      onSwitchToLogin={() => setView('login')}
      onSuccess={() => setView('profile')}
    />
  );
}
