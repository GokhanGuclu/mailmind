import type { LanguageMode, ThemeMode } from '../../shared/types/ui';

export const homePageSettings: {
  defaultLanguage: LanguageMode;
  defaultTheme: ThemeMode;
  allowLanguageModes: LanguageMode[];
  allowThemeModes: ThemeMode[];
} = {
  defaultLanguage: 'tr',
  defaultTheme: 'light',
  allowLanguageModes: ['tr', 'en'],
  allowThemeModes: ['light', 'dark', 'ultra-dark'],
};
