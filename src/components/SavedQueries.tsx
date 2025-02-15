import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SavedQueriesProps {
  theme: 'light' | 'dark';
  onLoad: (query: string, savedQuery: { title: string; query: string; timestamp: string }) => void;
}

const SavedQueries: React.FC<SavedQueriesProps> = ({ theme, onLoad }) => {
  const { t } = useLanguage();
  const [queries, setQueries] = React.useState<Array<{
    title: string;
    query: string;
    timestamp: string;
  }>>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedQuery, setSelectedQuery] = React.useState<{
    title: string;
    query: string;
    timestamp: string;
  } | null>(null);
  const [editedQueryText, setEditedQueryText] = React.useState('');
  const [notification, setNotification] = React.useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10; // Her sayfada gösterilecek sorgu sayısı

  React.useEffect(() => {
    const savedQueries = JSON.parse(localStorage.getItem('savedQueries') || '[]');
    setQueries(savedQueries);
  }, []);

  const handleDelete = (index: number) => {
    const newQueries = [...queries];
    newQueries.splice(index, 1);
    localStorage.setItem('savedQueries', JSON.stringify(newQueries));
    setQueries(newQueries);
    
    if (selectedQuery && selectedQuery.timestamp === queries[index].timestamp) {
      setSelectedQuery(null);
      setEditedQueryText('');
    }

    setNotification({
      show: true,
      message: t('query.deleted.success'),
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectQuery = (query: { title: string; query: string; timestamp: string }) => {
    setSelectedQuery(query);
    setEditedQueryText(query.query);
  };

  const handleSaveEdit = () => {
    if (!selectedQuery) return;

    const savedQueries = JSON.parse(localStorage.getItem('savedQueries') || '[]');
    const updatedQueries = savedQueries.map((q: any) => {
      if (q.title === selectedQuery.title && q.timestamp === selectedQuery.timestamp) {
        return {
          ...q,
          query: editedQueryText,
          lastModified: new Date().toISOString()
        };
      }
      return q;
    });

    localStorage.setItem('savedQueries', JSON.stringify(updatedQueries));
    setQueries(updatedQueries);
    
    setNotification({
      show: true,
      message: t('query.saved.success'),
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotification({ 
        show: true, 
        message: t('query.copied'),
        type: 'success'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const prettifyJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  const filteredQueries = queries.filter(query =>
    query.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQueries = filteredQueries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="row">
      {/* Sol Kolon - Sorgu Listesi */}
      <div className="col-md-4">
        <div className={`card ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}>
          <div className="card-header">
            <div className="input-group input-group-sm">
              <span className={`input-group-text ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}>
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className={`form-control ${theme === 'dark' 
                  ? 'bg-dark text-white border-light placeholder-white' 
                  : ''
                }`}
                placeholder={t('saved.queries.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('saved.queries.search')}
                aria-describedby="search-queries"
              />
              {searchTerm && (
                <button
                  className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                  type="button"
                  onClick={() => setSearchTerm('')}
                  title={t('clear.search')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className={`table table-hover mb-0 ${theme === 'dark' ? 'table-dark' : ''}`}>
                <thead>
                  <tr>
                    <th>{t('saved.queries.title')}</th>
                    <th>{t('saved.queries.date')}</th>
                    <th className="text-end">{t('saved.queries.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQueries.map((query, index) => (
                    <tr 
                      key={index}
                      className={selectedQuery?.timestamp === query.timestamp ? 'table-active' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={() => handleSelectQuery(query)}>
                        {query.title}
                      </td>
                      <td onClick={() => handleSelectQuery(query)}>
                        {new Date(query.timestamp).toLocaleString()}
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(indexOfFirstItem + index)}
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title={t('saved.queries.delete')}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="d-flex justify-content-center p-2">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className={`page-link ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''}`}
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li 
                      key={index} 
                      className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                    >
                      <button
                        className={`page-link ${
                          theme === 'dark' 
                            ? currentPage === index + 1
                              ? 'bg-primary text-white border-primary' 
                              : 'bg-dark text-white border-secondary'
                            : ''
                        }`}
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className={`page-link ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''}`}
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Sağ Kolon - Sorgu Düzenleme */}
      <div className="col-md-8">
        {selectedQuery ? (
          <div className={`card ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{selectedQuery.title}</h5>
              <div className="btn-group">
                <button 
                  type="button"
                  className={`btn btn-m ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                  onClick={() => {
                    const formatted = prettifyJson(editedQueryText);
                    setEditedQueryText(formatted);
                  }}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title={t('prettify')}
                >
                  <i className="bi bi-code-square"></i>
                </button>
                <button 
                  type="button"
                  className={`btn btn-m ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                  onClick={() => handleCopy(editedQueryText)}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title={t('query.copy')}
                >
                  <i className="bi bi-clipboard"></i>
                </button>
                <button 
                  type="button"
                  className={`btn btn-m ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                  onClick={handleSaveEdit}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title={t('save.changes')}
                >
                  <i className="bi bi-save"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <textarea
                className={`form-control font-monospace ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                value={editedQueryText}
                onChange={(e) => setEditedQueryText(e.target.value)}
                rows={15}
                style={{ 
                  resize: 'vertical',
                  minHeight: '300px'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-5">
            {t('select.query.to.edit')}
          </div>
        )}
      </div>

      {/* Bootstrap Toast Notification - Sağ Alt */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1061 }}>
        {notification?.show && (
          <div 
            className={`toast show align-items-center text-white bg-${notification.type === 'success' ? 'success' : 'danger'} border-0`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">
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

export default SavedQueries;