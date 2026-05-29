import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, RegisterForm } from '@/features/auth';

type AuthRole = 'operator' | 'admin' | 'owner'

const roleHome: Record<AuthRole, string> = {
    operator: '/workload',
    admin: '/stats',
    owner: '/stats',
}

export const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleSuccess = (role?: AuthRole) => {
        const home = role && role in roleHome ? roleHome[role as AuthRole] : '/workload'
        navigate(home, { replace: true });
    };

    return isLogin ? (
        <LoginForm
            onSwitchToRegister={() => setIsLogin(false)}
            onSuccess={handleSuccess}
        />
    ) : (
        <RegisterForm
            onSwitchToLogin={() => setIsLogin(true)}
            onSuccess={handleSuccess}
        />
    );
};
