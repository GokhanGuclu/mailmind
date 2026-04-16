import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { globalUIConfig } from '../../app/config/global-ui';
import type { LanguageMode, ThemeMode } from '../types/ui';
import { deleteCookie, getCookie, setCookie } from '../utils/cookies';

const COOKIE_CONSENT = 'mailmind_cookie_consent';
const COOKIE_LANGUAGE = 'mailmind_language';
const COOKIE_THEME = 'mailmind_theme';

type CookieConsent = 'accepted' | 'rejected' | null;

type UIContextValue = {
  language: LanguageMode;
  theme: ThemeMode;
  cookieConsent: CookieConsent;
  setLanguage: (value: LanguageMode) => void;
  setTheme: (value: ThemeMode) => void;
  acceptCookies: () => void;
  rejectCookies: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const initialConsent = (getCookie(COOKIE_CONSENT) as CookieConsent) ?? null;
  const initialLanguage = (getCookie(COOKIE_LANGUAGE) as LanguageMode | null) ?? globalUIConfig.language;
  const initialTheme = (getCookie(COOKIE_THEME) as ThemeMode | null) ?? globalUIConfig.theme;

  const [cookieConsent, setCookieConsent] = useState<CookieConsent>(initialConsent);
  const [language, setLanguageState] = useState<LanguageMode>(initialLanguage);
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  const setLanguage = (value: LanguageMode) => {
    setLanguageState(value);
    if (cookieConsent === 'accepted') {
      setCookie(COOKIE_LANGUAGE, value);
    }
  };

  const setTheme = (value: ThemeMode) => {
    setThemeState(value);
    if (cookieConsent === 'accepted') {
      setCookie(COOKIE_THEME, value);
    }
  };

  const acceptCookies = () => {
    setCookieConsent('accepted');
    setCookie(COOKIE_CONSENT, 'accepted');
    setCookie(COOKIE_LANGUAGE, language);
    setCookie(COOKIE_THEME, theme);
  };

  const rejectCookies = () => {
    setCookieConsent('rejected');
    setCookie(COOKIE_CONSENT, 'rejected');
    deleteCookie(COOKIE_LANGUAGE);
    deleteCookie(COOKIE_THEME);
  };

  const value = useMemo(
    () => ({ language, theme, cookieConsent, setLanguage, setTheme, acceptCookies, rejectCookies }),
    [language, theme, cookieConsent],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return context;
}
