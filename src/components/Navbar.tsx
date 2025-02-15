import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onShowSavedQueries: () => void;
  currentView: 'builder' | 'saved';
  onExport?: () => void;
  onImport?: (file: File) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onShowSavedQueries, 
  currentView,
  onExport,
  onImport 
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
    event.target.value = '';
  };
  
  return (
    <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'} border-bottom shadow-sm`}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="/">
          {t('app.title')}
        </a>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a 
                className={`nav-link ${currentView === 'saved' ? 'active' : ''}`} 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onShowSavedQueries();
                }}
              >
                {t('nav.saved.queries')}
              </a>
            </li>
          </ul>
          <div className="d-flex gap-2 align-items-center">
            <div className="btn-group me-2">
              <button 
                className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-primary'}`}
                onClick={onExport}
                title={t('export.all')}
              >
                <i className="bi bi-download me-1"></i>
                {t('export')}
              </button>
              <label 
                className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-primary'}`}
                title={t('import.all')}
              >
                <i className="bi bi-upload me-1"></i>
                {t('import')}
                <input
                  type="file"
                  className="d-none"
                  accept=".json"
                  onChange={handleFileImport}
                />
              </label>
            </div>

            <button 
              className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
              onClick={toggleLanguage}
            >
              {language === 'tr' ? 'EN' : 'TR'}
            </button>
            <button 
              className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
              onClick={toggleTheme}
            >
              <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;