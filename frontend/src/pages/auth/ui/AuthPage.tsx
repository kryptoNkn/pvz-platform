import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, RegisterForm } from '@/features/auth';

export const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/workload');
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
