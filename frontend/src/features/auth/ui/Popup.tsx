import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './AuthForms.module.scss';

interface PopupProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Popup: React.FC<PopupProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return createPortal(
    <div className={styles['error-popup']} onClick={onClose}>
      {message}
    </div>,
    
    document.getElementById('popup-root')!
  );
};

export default Popup;