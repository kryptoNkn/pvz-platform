import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/styles/globals.scss';
import App from '@/app/App';
import { LangProvider } from '@/shared/i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);
