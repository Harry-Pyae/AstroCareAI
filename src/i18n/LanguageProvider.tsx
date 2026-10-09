import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LANGUAGE_KEY, localizedDate, translate, type Language, type Translator } from './index';

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: Translator; date: (value: string, options?: Intl.DateTimeFormatOptions) => string } | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem(LANGUAGE_KEY) === 'my' ? 'my' : 'en'; } catch { return 'en'; }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `ASTROCARE — ${translate(language, 'Baseline brief')}`;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Switching still works when storage is unavailable. */ }
  }, [language]);
  const t: Translator = (key, params) => translate(language, key, params);
  return <LanguageContext.Provider value={{ language, setLanguage, t, date: (value, options) => localizedDate(value, language, options) }}>{children}</LanguageContext.Provider>;
}
export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required');
  return context;
}
