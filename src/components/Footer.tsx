import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  theme: 'light' | 'dark';
}

const Footer: React.FC<FooterProps> = ({ theme }) => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const version = 'v1.1.0'; // Versiyon bilgisi

  return (
    <footer className={`footer py-3 ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light'}`}>
      <div className="container text-center">
        <div className="mb-2">
          <a
            href="https://github.com/oktaykcr/elasticsearch-query-builder"
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
          >
            <i className="bi bi-github me-2"></i>
            View on GitHub
          </a>
          <span 
            className={`ms-2 badge ${theme === 'dark' ? 'bg-light text-dark' : 'bg-dark text-white'}`}
            title="Version"
          >
            {version}
          </span>
        </div>
        <small className={theme === 'dark' ? 'text-white-50' : 'text-muted'}>
          &copy; {currentYear} {t('footer.copyright')}
        </small>
      </div>
    </footer>
  );
};

export default Footer;