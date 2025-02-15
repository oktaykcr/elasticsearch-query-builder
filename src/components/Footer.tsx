import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const version = "1.0.0";

  return (
    <footer className={`py-2 mt-auto border-top ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="container-fluid text-center">
        <small className="text-muted">
          {t('app.version')}: {version}
        </small>
      </div>
    </footer>
  );
};

export default Footer;