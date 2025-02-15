import React, { useState, useRef } from 'react';
import { ElasticsearchMapping } from '../types/types';
import { useLanguage } from '../context/LanguageContext';

interface QueryBuilderProps {
  mapping: ElasticsearchMapping;
  onQueryGenerated: (query: string) => void;
  theme: 'light' | 'dark';
  savedQueries?: Array<{
    title: string;
    query: string;
  }>;
}

type QueryType = 'simple' | 'bool_filter' | 'bool_should' | 'bool_must';

interface QueryOptions {
  trackTotalHits: boolean;
  includeAggs: boolean;
  includeSource: boolean;
  selectedSourceFields: string[];
}

interface FieldConfig {
  field: string;
  operator: string;
  value: string;
  isNested: boolean;
  nestedPath: string;
  queryType: QueryType;
}

const getOperatorsForFieldType = (type: string): string[] => {
  const commonOperators = ['term', 'terms', 'exists'];
  
  switch (type) {
    case 'text':
      return ['match', 'match_phrase', 'wildcard', ...commonOperators];
    case 'keyword':
      return ['term', 'terms', 'prefix', 'exists'];
    case 'date':
      return ['range', ...commonOperators];
    case 'integer':
    case 'long':
    case 'float':
    case 'double':
      return ['range', 'term', 'terms', 'exists'];
    default:
      return ['match', ...commonOperators];
  }
};

const QueryBuilder: React.FC<QueryBuilderProps> = ({ mapping, onQueryGenerated, theme }) => {
  const { t } = useLanguage();

  // Add new state for copy status
  const [isCopied, setIsCopied] = useState(false);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [queryType, setQueryType] = useState<QueryType>('simple');
  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    trackTotalHits: true,
    includeAggs: false,
    includeSource: false,
    selectedSourceFields: []
  });
  const [sourceSearchTerm, setSourceSearchTerm] = useState<string>('');

  // Mapping'den properties'i çıkarmak için yardımcı fonksiyon
  const extractProperties = (mapping: any) => {
    if (!mapping) return null;
    
    // {"indexname": {"mappings": {"properties": {}}}} formatını kontrol et
    const indexName = Object.keys(mapping)[0];
    if (indexName && mapping[indexName]?.mappings?.properties) {
      return {
        properties: mapping[indexName].mappings.properties,
        indexName
      };
    }
    
    // Direkt {"properties": {}} formatını kontrol et
    if (mapping.properties) {
      return {
        properties: mapping.properties,
        indexName: null
      };
    }
    
    return null;
  };

  const extractedMapping = extractProperties(mapping);
  const properties = extractedMapping?.properties;
  const indexName = extractedMapping?.indexName;

  // getAllFields fonksiyonunu güncelle
  const getAllFields = (obj: any, parentPath: string = ''): string[] => {
    let fields: string[] = [];
    
    if (!obj) return fields;
    
    // Eğer properties içindeyse direkt kullan
    const targetObj = obj.properties || obj;
    
    Object.entries(targetObj).forEach(([key, value]: [string, any]) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      
      if (value.type === 'nested') {
        fields.push(currentPath);
        if (value.properties) {
          fields = fields.concat(getAllFields(value.properties, currentPath));
        }
      } else if (value.properties) {
        fields = fields.concat(getAllFields(value.properties, currentPath));
      } else {
        fields.push(currentPath);
      }
    });
    
    return fields;
  };

  // getFieldType fonksiyonunu güncelle
  const getFieldType = (fieldPath: string): string => {
    if (!properties) return 'text';
    
    const parts = fieldPath.split('.');
    let current: any = properties;
    
    for (const part of parts) {
      if (!current[part]) return 'text';
      if (current[part].type) return current[part].type;
      current = current[part].properties;
    }
    
    return 'text';
  };

  // generateQuery fonksiyonunu güncelleyelim
  const generateQuery = () => {
    if (!properties) return;

    const mustQueries: any[] = [];
    const shouldQueries: any[] = [];
    const filterQueries: any[] = [];
    const nestedQueries: { [key: string]: { must: any[], should: any[], filter: any[] } } = {};

    // Önce tüm sorguları grupla
    fieldConfigs.forEach(config => {
      let innerQuery = {};
      
      // Temel sorguyu oluştur
      if (config.operator === 'exists') {
        innerQuery = {
          exists: {
            field: config.field
          }
        };
      } else if (config.operator === 'terms') {
        const valueArray = config.value.split(',').map(v => v.trim());
        innerQuery = {
          terms: {
            [config.field]: valueArray
          }
        };
      } else {
        innerQuery = {
          [config.operator]: {
            [config.field]: config.value
          }
        };
      }
      
      // Nested sorgular için gruplama yap
      if (config.isNested && config.nestedPath) {
        if (!nestedQueries[config.nestedPath]) {
          nestedQueries[config.nestedPath] = {
            must: [],
            should: [],
            filter: []
          };
        }

        // Sorgu tipine göre ilgili nested gruba ekle
        switch (config.queryType) {
          case 'bool_filter':
            nestedQueries[config.nestedPath].filter.push(innerQuery);
            break;
          case 'bool_should':
            nestedQueries[config.nestedPath].should.push(innerQuery);
            break;
          case 'bool_must':
          default:
            nestedQueries[config.nestedPath].must.push(innerQuery);
            break;
        }
      } else {
        // Normal sorguları ilgili listelerine ekle
        switch (config.queryType) {
          case 'bool_filter':
            filterQueries.push(innerQuery);
            break;
          case 'bool_should':
            shouldQueries.push(innerQuery);
            break;
          case 'bool_must':
          default:
            mustQueries.push(innerQuery);
            break;
        }
      }
    });

    // Nested sorguları birleştir ve ana sorgulara ekle
    Object.entries(nestedQueries).forEach(([path, queries]) => {
      const nestedBoolQuery: any = {
        bool: {}
      };

      if (queries.must.length > 0) {
        nestedBoolQuery.bool.must = queries.must;
      }
      if (queries.should.length > 0) {
        nestedBoolQuery.bool.should = queries.should;
        nestedBoolQuery.bool.minimum_should_match = 1;
      }
      if (queries.filter.length > 0) {
        nestedBoolQuery.bool.filter = queries.filter;
      }

      const nestedQuery = {
        nested: {
          path: path,
          query: nestedBoolQuery
        }
      };

      // Nested sorguyu ana bool sorguya ekle
      if (queries.must.length > 0) {
        mustQueries.push(nestedQuery);
      } else if (queries.should.length > 0) {
        shouldQueries.push(nestedQuery);
      } else if (queries.filter.length > 0) {
        filterQueries.push(nestedQuery);
      }
    });

    // Ana sorguyu oluştur
    const query: any = {
      query: {
        bool: {}
      }
    };

    if (mustQueries.length > 0) query.query.bool.must = mustQueries;
    if (shouldQueries.length > 0) {
      query.query.bool.should = shouldQueries;
      query.query.bool.minimum_should_match = 1;
    }
    if (filterQueries.length > 0) query.query.bool.filter = filterQueries;

    // Query options
    if (queryOptions.trackTotalHits) {
      query.track_total_hits = true;
    }

    if (queryOptions.includeSource) {
      if (queryOptions.selectedSourceFields.length > 0) {
        query._source = queryOptions.selectedSourceFields;
      } else {
        query._source = true;
      }
    }

    if (queryOptions.includeAggs && fieldConfigs.length > 0) {
      query.aggs = {
        [`${fieldConfigs[0].field}_aggs`]: {
          terms: {
            field: fieldConfigs[0].field,
            size: 10
          }
        }
      };
    }

    setIsCopied(false);
    onQueryGenerated(JSON.stringify(query, null, 2));
  };

  const getNestedPaths = () => {
    const paths: string[] = [];
    
    const checkNested = (obj: any, parentPath: string = '') => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]: [string, any]) => {
        const currentPath = parentPath ? `${parentPath}.${key}` : key;
        
        if (value.type === 'nested') {
          paths.push(currentPath);
          if (value.properties) {
            checkNested(value.properties, currentPath);
          }
        } else if (value.properties) {
          checkNested(value.properties, currentPath);
        }
      });
    };

    checkNested(properties);
    return paths;
  };

  const handleSourceFieldToggle = (field: string) => {
    setQueryOptions(prev => ({
      ...prev,
      selectedSourceFields: prev.selectedSourceFields.includes(field)
        ? prev.selectedSourceFields.filter(f => f !== field)
        : [...prev.selectedSourceFields, field]
    }));
  };

  // Dropdown'dan alan seçimi yapıldığında
  const handleFieldSelect = (field: string) => {
    setFieldConfigs([
      ...fieldConfigs,
      {
        field: field,
        operator: 'match',
        value: '',
        isNested: false,
        nestedPath: '',
        queryType: 'simple'
      }
    ]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Alan ekleme fonksiyonunu güncelleyelim
  const handleAddField = () => {
    if (searchTerm) {
      setFieldConfigs([
        ...fieldConfigs,
        {
          field: searchTerm,
          operator: 'match',
          value: '',
          isNested: false,
          nestedPath: '',
          queryType: 'simple'
        }
      ]);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  // Alan kaldırma fonksiyonu
  const handleRemoveField = (index: number) => {
    setFieldConfigs(fieldConfigs.filter((_, i) => i !== index));
  };

  // Alan güncelleme fonksiyonu
  const handleUpdateFieldConfig = (index: number, updates: Partial<FieldConfig>) => {
    setFieldConfigs(
      fieldConfigs.map((config, i) => 
        i === index ? { ...config, ...updates } : config
      )
    );
  };

  // Reset fonksiyonunu güncelleyelim
  const handleReset = () => {
    setFieldConfigs([]);
    setSearchTerm('');
    setQueryType('simple');
    setQueryOptions({
      trackTotalHits: true,
      includeAggs: false,
      includeSource: false,
      selectedSourceFields: []
    });
    // Oluşturulan sorguyu sıfırla
    onQueryGenerated('');
  };

  return (
    <>
      <div className="d-flex flex-column gap-3">
        {/* Alan seçimi ve ekleme bölümünü güncelleyelim */}
        <div>
          <label className={`form-label ${theme === 'dark' ? 'text-white' : ''}`}>
            {t('field.selection')}
          </label>
          <div className="d-flex gap-2">
            <div className="position-relative flex-grow-1" ref={dropdownRef}>
              <input
                type="text"
                className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                placeholder={t('field.search')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && searchTerm && (
                <div className={`position-absolute w-100 mt-1 ${theme === 'dark' ? 'bg-dark text-white border-light' : 'bg-white'}`} style={{ 
                  zIndex: 1000,
                  border: '1px solid rgba(0,0,0,.15)',
                  borderRadius: '0.25rem',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {getAllFields(properties)
                    .filter(field => field.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(field => (
                      <div
                        key={field}
                        className="p-2 cursor-pointer hover-bg-light"
                        onClick={() => handleFieldSelect(field)}
                      >
                        {field}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <button 
              className="btn btn-m btn-outline-primary"
              onClick={handleAddField}
              disabled={!searchTerm}
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>

        {/* Seçili alanların listesi */}
        {fieldConfigs.map((config, index) => (
          <div key={index} className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className={`mb-0 ${theme === 'dark' ? 'text-white' : ''}`}>{config.field}</h6>
              <button 
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleRemoveField(index)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
            
            <div className="mb-2">
              <select 
                className={`form-select ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                value={config.queryType}
                onChange={(e) => handleUpdateFieldConfig(index, { queryType: e.target.value as QueryType })}
              >
                <option value="simple">{t('query.type.simple')}</option>
                <option value="bool_must">{t('query.type.must')}</option>
                <option value="bool_should">{t('query.type.should')}</option>
                <option value="bool_filter">{t('query.type.filter')}</option>
              </select>
            </div>

            <div className="mb-2">
              <select 
                className={`form-select ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                value={config.operator}
                onChange={(e) => handleUpdateFieldConfig(index, { operator: e.target.value })}
              >
                {getOperatorsForFieldType(getFieldType(config.field)).map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            {config.operator !== 'exists' && (
              <input 
                type="text"
                className={`form-control mb-2 ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                value={config.value}
                onChange={(e) => handleUpdateFieldConfig(index, { value: e.target.value })}
                placeholder={config.operator === 'terms' ? t('values.placeholder') : t('value.placeholder')}
              />
            )}

            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                id={`isNested-${index}`}
                checked={config.isNested}
                onChange={(e) => {
                  const isNested = e.target.checked;
                  handleUpdateFieldConfig(index, { 
                    isNested,
                    nestedPath: isNested ? getNestedPaths()[0] || '' : ''
                  });
                }}
              />
              <label className={`form-check-label ${theme === 'dark' ? 'text-white' : ''}`} htmlFor={`isNested-${index}`}>
                Nested
              </label>
            </div>

            {config.isNested && (
              <div>
                <select
                  className={`form-select ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                  value={config.nestedPath}
                  onChange={(e) => handleUpdateFieldConfig(index, { nestedPath: e.target.value })}
                >
                  {getNestedPaths().map(path => (
                    <option key={path} value={path}>{path}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}

        <div>
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="trackTotalHits"
              checked={queryOptions.trackTotalHits}
              onChange={(e) => setQueryOptions(prev => ({ ...prev, trackTotalHits: e.target.checked }))}
            />
            <label className={`form-check-label ${theme === 'dark' ? 'text-white' : ''}`} htmlFor="trackTotalHits">
              Track Total Hits
            </label>
          </div>
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="includeSource"
              checked={queryOptions.includeSource}
              onChange={(e) => setQueryOptions(prev => ({ ...prev, includeSource: e.target.checked }))}
            />
            <label className={`form-check-label ${theme === 'dark' ? 'text-white' : ''}`} htmlFor="includeSource">
              Source
            </label>
          </div>
          
          {queryOptions.includeSource && (
            <div className="ms-4 mt-2">
              <input
                type="text"
                className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-light' : ''}`}
                placeholder="Search source fields..."
                value={sourceSearchTerm}
                onChange={(e) => setSourceSearchTerm(e.target.value)}
              />
              <div className="mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {getAllFields(properties)
                  .filter(field => field.toLowerCase().includes(sourceSearchTerm.toLowerCase()))
                  .map(field => (
                    <div key={field} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`source-${field}`}
                        checked={queryOptions.selectedSourceFields.includes(field)}
                        onChange={() => handleSourceFieldToggle(field)}
                      />
                      <label className={`form-check-label ${theme === 'dark' ? 'text-white' : ''}`} htmlFor={`source-${field}`}>
                        {field}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          <button 
            onClick={generateQuery}
            className={`btn ${theme === 'dark' ? 'btn-light' : 'btn-primary'} flex-grow-1`}
          >
            {t('query.create')}
          </button>
          <button 
            onClick={handleReset}
            className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default QueryBuilder;