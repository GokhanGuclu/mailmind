import type { LanguageMode, ThemeMode } from '../../shared/types/ui';

export const registerPageSettings: {
  defaultLanguage: LanguageMode;
  defaultTheme: ThemeMode;
  allowLanguageModes: LanguageMode[];
  allowThemeModes: ThemeMode[];
} = {
  defaultLanguage: 'tr',
  defaultTheme: 'ultra-dark',
  allowLanguageModes: ['tr', 'en'],
  allowThemeModes: ['light', 'dark', 'ultra-dark'],
};
