import type { LanguageMode, ThemeMode } from '../../shared/types/ui';

export const loginPageSettings: {
  defaultLanguage: LanguageMode;
  defaultTheme: ThemeMode;
  allowLanguageModes: LanguageMode[];
  allowThemeModes: ThemeMode[];
} = {
  defaultLanguage: 'tr',
  defaultTheme: 'dark',
  allowLanguageModes: ['tr', 'en'],
  allowThemeModes: ['light', 'dark', 'ultra-dark'],
};
