import Languages from 'lucide-react/dist/esm/icons/languages.js';
import Moon from 'lucide-react/dist/esm/icons/moon.js';
import Sun from 'lucide-react/dist/esm/icons/sun.js';
import type { LanguageMode, ThemeMode } from '../types/ui';
import turkeyFlag from '../../assets/flags/tr.svg';
import ukFlag from '../../assets/flags/uk.svg';

type Props = {
  language: LanguageMode;
  theme: ThemeMode;
  setLanguage: (value: LanguageMode) => void;
  setTheme: (value: ThemeMode) => void;
};

export function TopLanguageSwitch({ language, theme, setLanguage, setTheme }: Props) {
  const isDarkMode = theme !== 'light';

  return (
    <div className="top-language-switch" role="group" aria-label="Dil">
      <button
        type="button"
        className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
        onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
        aria-label={isDarkMode ? 'Koyu modu kapat' : 'Koyu modu aç'}
      >
        <span className="theme-toggle-knob" aria-hidden="true">
          <Sun size={16} className="theme-knob-icon sun" />
          <Moon size={16} className="theme-knob-icon moon" />
        </span>
      </button>

      <button
        type="button"
        className={`language-option plain ${language === 'tr' ? 'active' : ''}`}
        onClick={() => setLanguage('tr')}
      >
        <img
          src={turkeyFlag}
          alt="Türkiye bayrağı"
          className="language-flag"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        TR
      </button>

      <span className="language-divider-icon" aria-hidden="true">
        <Languages size={12} />
      </span>

      <button
        type="button"
        className={`language-option plain ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
      >
        <img
          src={ukFlag}
          alt="United Kingdom flag"
          className="language-flag"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        EN
      </button>
    </div>
  );
}
