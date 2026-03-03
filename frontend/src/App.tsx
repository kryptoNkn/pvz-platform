import { useState } from 'react';
import { LoginForm, RegisterForm } from './components/AuthForms';
import ProfilePage from './pages/ProfilePage';

type View = 'login' | 'register' | 'profile';

function App() {
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

export default App;
