import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { API_BASE_URL, getCommonHeaders } from '../services/api';

// Import local translations
import arTranslations from '../locales/ar.json';
import enTranslations from '../locales/en.json';

const LOCAL_DICTS = {
  ar: arTranslations,
  en: enTranslations,
};

// --- TYPES & INTERFACES ---
export interface TranslationContextType {
  t: (
    key: string,
    fallbackOrOptions?: string | Record<string, string | number>,
    options?: Record<string, string | number>
  ) => string;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  isLoading: boolean;
  isRTL: boolean;
}

// --- CONTEXT ---
export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('jobito_language') as 'ar' | 'en') || 'en';
  });

  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>({});
  
  // Using Refs for the queue to avoid state updates during render
  const missingKeysRef = useRef<Set<string>>(new Set());
  const pendingRequestsRef = useRef<Set<string>>(new Set());

  // 1. Sync Language to backend
  const syncLanguageToBackend = useCallback((newLang: 'ar' | 'en') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_BASE_URL}/api/users/me/language`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': '69420',
      },
      body: JSON.stringify({ language: newLang }),
    }).catch(() => {});
  }, []);

  // 2. Language Switch Side Effects
  const applyLanguageProps = useCallback((lang: 'ar' | 'en') => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('jobito_language', lang);
  }, []);

  useEffect(() => {
    applyLanguageProps(language);
  }, [language, applyLanguageProps]);

  const setLanguage = useCallback((lang: 'ar' | 'en') => {
    setLanguageState(lang);
    syncLanguageToBackend(lang);
  }, [syncLanguageToBackend]);

  // 3. Effect to process missing keys (Render-Safe background translation)
  useEffect(() => {
    const processQueue = async () => {
      if (missingKeysRef.current.size === 0) return;

      const keysToTranslate = Array.from(missingKeysRef.current);
      missingKeysRef.current.clear();

      // Process all missing keys in parallel for instant results
      await Promise.all(keysToTranslate.map(async (key) => {
        const cacheKey = `${language}:${key}`;
        if (pendingRequestsRef.current.has(cacheKey)) return;


        pendingRequestsRef.current.add(cacheKey);

        try {
          const response = await fetch(`${API_BASE_URL}/api/Translation`, {
            method: 'POST',
            headers: getCommonHeaders({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              text: key,
              targetLanguage: language,
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.translatedText) {
              setDynamicTranslations(prev => ({
                ...prev,
                [cacheKey]: data.translatedText
              }));
            }
          }
        } catch (err) {
          console.warn('[Translation API Error]:', err);
        } finally {
          pendingRequestsRef.current.delete(cacheKey);
        }
      }));
    };

    const interval = setInterval(processQueue, 100); // Check every 100ms for instant pickup
    return () => clearInterval(interval);

  }, [language]);

  // 4. Main 't' function (Pure during render)
  const t = useCallback(
    (
      key: string,
      fallbackOrOptions?: string | Record<string, string | number>,
      options?: Record<string, string | number>
    ): string => {
      if (!key) return '';

      let fallbackText: string | undefined;
      let actualOptions: Record<string, string | number> | undefined;

      if (typeof fallbackOrOptions === 'string') {
        fallbackText = fallbackOrOptions;
        actualOptions = options;
      } else if (typeof fallbackOrOptions === 'object') {
        actualOptions = fallbackOrOptions;
      }

      // Priority 1: Local JSON dictionary (Instant)
      const currentDict = LOCAL_DICTS[language] as Record<string, string>;
      let text = currentDict[key];

      // Priority 2: Dynamic translations cache
      const cacheKey = `${language}:${key}`;
      if (!text && dynamicTranslations[cacheKey]) {
        text = dynamicTranslations[cacheKey];
      }

      // Priority 3: Final fallback logic
      if (!text) {
        text = fallbackText || key;
        
        // Background queueing (Safe because it's a Ref mutation, not a state update)
        const isArabicText = /[\u0600-\u06FF]/.test(key);
        const needsTranslation = (language === 'en' && isArabicText) || (language === 'ar' && !isArabicText);
        
        if (needsTranslation && !dynamicTranslations[cacheKey] && !pendingRequestsRef.current.has(cacheKey)) {
          missingKeysRef.current.add(key);
        }
      }

      // Variable Replacement
      if (actualOptions && typeof text === 'string') {
        Object.entries(actualOptions).forEach(([k, v]) => {
          text = text?.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
      }
      return text;
    },
    [language, dynamicTranslations]
  );

  const contextValue: TranslationContextType = {
    t,
    language,
    setLanguage,
    isLoading: false,
    isRTL: language === 'ar',
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
