import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'tr';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'app.title': 'Elasticsearch Query Builder',
    'nav.home': 'Home',
    'mapping.title': 'Mapping JSON',
    'mapping.placeholder': 'Paste your mapping JSON here...',
    'mapping.error': 'Invalid JSON format',
    'query.builder': 'Query Builder',
    'query.generated': 'Generated Query',
    'query.create': 'Create Query',
    'query.copy': 'Copy',
    'query.placeholder': 'Select fields to create query',
    'query.initial': 'Enter mapping JSON first',
    'field.selection': 'Field Selection',
    'field.search': 'Search fields...',
    'query.type': 'Query Type',
    'query.type.simple': 'Simple Query',
    'query.type.bool': 'Bool Filter Query',
    'operator': 'Operator',
    'value': 'Value',
    'values': 'Values (comma separated)',
    'value.placeholder': 'Enter value',
    'values.placeholder': 'Example: value1, value2, value3',
    'mapping.required': 'Please enter a valid mapping JSON',
    'save.query.title': 'Save Query',
    'save.query.placeholder': 'Enter query title...',
    'save.query.save': 'Save',
    'save.query.cancel': 'Cancel',
    'nav.saved.queries': 'Saved Queries',
    'saved.queries.title': 'Saved Queries',
    'saved.queries.empty': 'No saved queries found',
    'saved.queries.date': 'Date',
    'saved.queries.actions': 'Actions',
    'saved.queries.load': 'Load',
    'saved.queries.delete': 'Delete',
    "saved.queries.title.column": "Title",
    'saved.queries.export': 'Export Queries',
    'saved.queries.import': 'Import Queries',
    'saved.queries.search': 'Search by title...',
    'saved.queries.no.results': 'No queries found matching your search',
    'app.version': 'Version',
    'saved.queries.select': 'Select saved query',
    'import.success': 'Queries imported successfully',
    'import.error': 'Error importing queries',
    'import': 'Import',
    'export': 'Export',
    'mapping.select': 'Select mapping JSON',
    'query.options': 'Query Options',
    'query.type.must': 'Must Query',
    'query.type.should': 'Should Query',
    'query.type.filter': 'Filter Query',
    'query.reset': 'Reset',
    'query.copied': 'Query copied to clipboard',
    'select.query.to.edit': 'Select a query to edit',
    'query.saved': 'Query saved',
    'prettify': 'Prettify',
    'save.changes': 'Save changes',
    'footer.copyright': 'Elasticsearch Query Builder',
  },
  tr: {
    'app.title': 'Elasticsearch Sorgu Oluşturucu',
    'nav.home': 'Ana Sayfa',
    'mapping.title': 'Mapping JSON',
    'mapping.placeholder': "Mapping JSON'ını buraya yapıştırın...",
    'mapping.error': 'Geçersiz JSON formatı',
    'query.builder': 'Sorgu Oluşturucu',
    'query.generated': 'Oluşturulan Sorgu',
    'query.create': 'Sorgu Oluştur',
    'query.copy': 'Kopyala',
    'query.placeholder': 'Sorgu oluşturmak için alanları seçin',
    'query.initial': "Önce mapping JSON'ı girin",
    'field.selection': 'Alan Seçimi',
    'field.search': 'Alan ara...',
    'query.type': 'Sorgu Tipi',
    'query.type.simple': 'Basit Sorgu',
    'query.type.bool': 'Bool Filter Sorgu',
    'operator': 'Operatör',
    'value': 'Değer',
    'values': 'Değerler (virgülle ayırın)',
    'value.placeholder': 'Değer girin',
    'values.placeholder': 'Örnek: değer1, değer2, değer3',
    'mapping.required': "Lütfen geçerli bir mapping JSON'ı girin",
    'save.query.title': 'Sorguyu Kaydet',
    'save.query.placeholder': 'Sorgu başlığını girin...',
    'save.query.save': 'Kaydet',
    'save.query.cancel': 'İptal',
    'nav.saved.queries': 'Kayıtlı Sorgular',
    'saved.queries.title': 'Kayıtlı Sorgular',
    'saved.queries.empty': 'Kayıtlı sorgu bulunamadı',
    'saved.queries.date': 'Tarih',
    'saved.queries.actions': 'İşlemler',
    'saved.queries.load': 'Yükle',
    'saved.queries.delete': 'Sil',
    "saved.queries.title.column": "Başlık",
    'saved.queries.export': 'Sorguları Dışa Aktar',
    'saved.queries.import': 'Sorguları İçe Aktar',
    'saved.queries.search': 'Başlığa göre ara...',
    'saved.queries.no.results': 'Aramanızla eşleşen sorgu bulunamadı',
    'app.version': 'Versiyon',
    'query.reset': 'Sıfırla',
    'saved.queries.select': 'Kayıtlı sorgu seç',
    'import.success': 'Sorgular başarıyla içe aktarıldı',
    'import.error': 'Sorguları içe aktarırken hata oluştu',
    'import': 'İçe aktar',
    'export': 'Dışa aktar',
    'mapping.select': 'Mapping JSON seçin',
    'query.options': 'Sorgu Seçenekleri',
    'query.type.must': 'Must Sorgusu',
    'query.type.should': 'Should Sorgusu',
    'query.type.filter': 'Filter Sorgusu',
    'query.copied': 'Sorgu kopyalandı',
    'select.query.to.edit': 'Düzenlemek için bir sorgu seçin',
    'query.saved': 'Sorgu kaydedildi',
    'prettify': 'Görünümünü İyileştir',
    'save.changes': 'Değişiklikleri kaydet',
    'footer.copyright': 'Elasticsearch Query Builder',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('tr');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'tr' ? 'en' : 'tr');
  };

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};