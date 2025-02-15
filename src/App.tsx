import React, { useState, useEffect } from 'react';
import QueryBuilder from './components/QueryBuilder';
import Navbar from './components/Navbar';
import SavedQueries from './components/SavedQueries';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import Footer from './components/Footer';

interface SavedMapping {
  name: string;
  mapping: any;
  timestamp: string;
}

const App: React.FC = () => {
  const { t } = useLanguage();
  const [mapping, setMapping] = useState(null);
  const [generatedQuery, setGeneratedQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const { theme } = useTheme();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [queryTitle, setQueryTitle] = useState('');
  const [currentView, setCurrentView] = useState<'builder' | 'saved'>('builder');
  const [mappingName, setMappingName] = useState('');
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [savedMappings, setSavedMappings] = useState<SavedMapping[]>([]);
  const [mappingText, setMappingText] = useState('');
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'danger';
  } | null>(null);
  const [isValidJson, setIsValidJson] = useState<boolean>(true);
  const [isEditable, setIsEditable] = useState<boolean>(false);

  // Load mapping from localStorage on component mount
  useEffect(() => {
    try {
      const savedMapping = localStorage.getItem('savedMappings');
      if (savedMapping) {
        setSavedMappings(JSON.parse(savedMapping));
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
    }
  }, []);

  const handleJsonInput = (jsonString: string) => {
    setMappingText(jsonString);
    try {
      const parsedJson = JSON.parse(jsonString);
      setMapping(parsedJson);
    } catch (e) {
      // Only show error if the string is not empty
      if (jsonString.trim()) {
        setNotification({ show: true, message: t('mapping.error'), type: 'danger' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const handleSaveMapping = () => {
    if (!mappingName.trim() || !mapping) return;

    const newMappings = [...savedMappings, {
      name: mappingName,
      mapping: mapping,
      timestamp: new Date().toISOString()
    }];
    
    setSavedMappings(newMappings);
    localStorage.setItem('savedMappings', JSON.stringify(newMappings));
    setMappingName('');
    setShowMappingModal(false);
    
    setNotification({
      show: true,
      message: t('mapping.saved'),
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectMapping = (selectedMapping: SavedMapping) => {
    setMapping(selectedMapping.mapping);
    setMappingText(JSON.stringify(selectedMapping.mapping, null, 2));
  };

  const handleSaveQuery = () => {
    if (!queryTitle.trim() || !generatedQuery) return;

    const savedQueries = JSON.parse(localStorage.getItem('savedQueries') || '[]');
    savedQueries.push({
      title: queryTitle,
      query: generatedQuery,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
    
    setQueryTitle('');
    setShowSaveModal(false);
    
    setNotification({
      show: true,
      message: t('query.saved'),
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleExport = () => {
    const exportData = {
      mappings: savedMappings,
      savedQueries: JSON.parse(localStorage.getItem('savedQueries') || '[]')
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'elasticsearch-query-builder-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      if (json.mappings) {
        setSavedMappings(json.mappings);
        localStorage.setItem('savedMappings', JSON.stringify(json.mappings));
      }
      
      if (json.savedQueries) {
        localStorage.setItem('savedQueries', JSON.stringify(json.savedQueries));
      }

      setNotification({ 
        show: true, 
        message: t('import.success'),
        type: 'success' 
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error importing data:', error);
      setNotification({ 
        show: true, 
        message: t('import.error'),
        type: 'danger' 
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteMapping = (mappingName: string) => {
    const newMappings = savedMappings.filter(m => m.name !== mappingName);
    setSavedMappings(newMappings);
    localStorage.setItem('savedMappings', JSON.stringify(newMappings));
    
    // Eğer silinen mapping seçili olan mapping ise, seçili mapping'i temizle
    if (mapping && savedMappings.find(m => m.name === mappingName)?.mapping === mapping) {
      setMapping(null);
      setMappingText('');
    }
  };

  // JSON doğrulama fonksiyonu
  const isValidJsonString = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  // JSON prettify fonksiyonu
  const prettifyJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  // Sorgu değişikliğini handle et
  const handleQueryChange = (newQuery: string) => {
    const isValid = isValidJsonString(newQuery);
    setIsValidJson(isValid);
    if (isValid) {
      setGeneratedQuery(newQuery);
    }
  };

  // Sorgu oluşturulduğunda veya seçildiğinde
  useEffect(() => {
    if (generatedQuery) {
      setIsEditable(true);
    }
  }, [generatedQuery]);

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
      <Navbar 
        onShowSavedQueries={() => setCurrentView('saved')} 
        currentView={currentView}
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <div className="flex-grow-1 container-fluid py-4 d-flex flex-column h-100">
        {currentView === 'builder' ? (
          <div className="row g-4 flex-grow-1">
            <div className="col-md-4">
              <div className={`card h-100 ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}>
                <div className={`card-header d-flex justify-content-between align-items-center ${theme === 'dark' ? 'border-light' : ''}`}>
                  <h3 className="card-title h5 mb-0">{t('mapping.title')}</h3>
                  <div className="d-flex gap-2">
                    <select 
                      className={`form-select form-select-sm w-auto ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                      onChange={(e) => {
                        const selected = savedMappings.find(m => m.name === e.target.value);
                        if (selected) {
                          handleSelectMapping(selected)
                        } else {
                          setMapping(null);
                          setMappingText('');
                        }
                      }}
                    >
                      <option value="">{t('mapping.select')}</option>
                      {savedMappings.map((m) => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    {mapping && savedMappings.length > 0 && (
                      <button 
                        className={`btn btn-sm btn-outline-danger`}
                        onClick={() => {
                          const selectedMapping = savedMappings.find(m => 
                            JSON.stringify(m.mapping) === JSON.stringify(mapping)
                          );
                          if (selectedMapping) {
                            handleDeleteMapping(selectedMapping.name);
                          }
                        }}
                        title={t('mapping.delete')}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                    <button 
                      className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                      onClick={() => setShowMappingModal(true)}
                      title={t('mapping.save')}
                    >
                      <i className="bi bi-save"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <textarea
                    className={`form-control h-100 ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                    style={{
                      minHeight: '500px',
                      fontFamily: 'monospace',
                      resize: 'none'
                    }}
                    placeholder={t('mapping.placeholder')}
                    value={mappingText}
                    onChange={(e) => handleJsonInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className={`card h-100 ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}>
                <div className={`card-header ${theme === 'dark' ? 'border-light' : ''}`}>
                  <h3 className="card-title h5 mb-0">{t('query.builder')}</h3>
                </div>
                <div className="card-body">
                  {mapping ? (
                    <QueryBuilder 
                      mapping={mapping} 
                      onQueryGenerated={setGeneratedQuery} 
                      theme={theme}
                    />
                  ) : (
                    <div className="alert alert-info">
                      {t('mapping.required')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className={`card h-100 ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}>
                <div className={`card-header d-flex justify-content-between align-items-center ${theme === 'dark' ? 'border-light' : ''}`}>
                  <h3 className="card-title h5 mb-0">{t('query.generated')}</h3>
                  {generatedQuery && (
                    <div className="d-flex gap-2">
                      <button 
                        className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                        onClick={() => {
                          if (generatedQuery) {
                            const formatted = prettifyJson(generatedQuery);
                            setGeneratedQuery(formatted);
                          }
                        }}
                        title={t('prettify')}
                      >
                        <i className="bi bi-code-square"></i>
                      </button>
                      <button 
                        className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                        onClick={() => setShowSaveModal(true)}
                        title={t('save.query.title')}
                      >
                        <i className="bi bi-save"></i>
                      </button>
                      <button 
                        className={`btn btn-sm ${isCopied ? 'btn-success' : theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                        onClick={handleCopy}
                        title={t('query.copy')}
                      >
                        <i className={`bi ${isCopied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                      </button>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <pre 
                    className={`p-3 rounded ${theme === 'dark' ? 'bg-dark text-white border' : 'bg-light'} 
                      ${!isValidJson ? 'border-danger' : theme === 'dark' ? 'border-light' : 'border'}`}
                    style={{ 
                      margin: 0,
                      overflow: 'auto',
                      minHeight: '200px',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                    contentEditable={isEditable}
                    onInput={(e: React.FormEvent<HTMLPreElement>) => {
                      const content = (e.target as HTMLPreElement).innerText;
                      handleQueryChange(content);
                    }}
                    onBlur={(e: React.FocusEvent<HTMLPreElement>) => {
                      if (isValidJson && generatedQuery) {
                        const formatted = prettifyJson(generatedQuery);
                        setGeneratedQuery(formatted);
                        (e.target as HTMLPreElement).innerText = formatted;
                      }
                    }}
                    dangerouslySetInnerHTML={{
                      __html: generatedQuery || (mapping ? t('query.placeholder') : t('query.initial'))
                    }}
                  />
                  
                  {!isValidJson && (
                    <small className="text-danger mt-2 d-block">
                      {t('invalid.json')}
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`card ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}>
            <div className="card-header">
              <h5 className="mb-0">{t('saved.queries.title')}</h5>
            </div>
            <div className="card-body">
              <SavedQueries
                theme={theme}
                onLoad={(query) => {
                  setGeneratedQuery(query);
                  setCurrentView('builder');
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-white' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">{t('save.query.title')}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowSaveModal(false)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                  placeholder={t('save.query.placeholder')}
                  value={queryTitle}
                  onChange={(e) => setQueryTitle(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-secondary'}`}
                  onClick={() => setShowSaveModal(false)}
                >
                  {t('save.query.cancel')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSaveQuery}
                >
                  {t('save.query.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Mapping Save Modal */}
      {showMappingModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-white' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">Save Mapping</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowMappingModal(false)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                  placeholder="Enter mapping name..."
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-secondary'}`}
                  onClick={() => setShowMappingModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSaveMapping}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}  

      <Footer />
      
      {/* Bootstrap Toast Notification */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1061 }}>
        {notification && (
          <div 
            className={`toast show align-items-center text-white bg-${notification.type} border-0`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">
                <i className={`bi bi-${notification.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                {notification.message}
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white me-2 m-auto" 
                onClick={() => setNotification(null)}
                aria-label="Close"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;