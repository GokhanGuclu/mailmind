import type { LanguageMode, ThemeMode } from '../types/ui';

type Labels = {
  themeTitle: string;
};

type Props = {
  language: LanguageMode;
  theme: ThemeMode;
  allowedThemes: ThemeMode[];
  setTheme: (value: ThemeMode) => void;
  labels: Labels;
};

export function PageControls({
  language,
  theme,
  allowedThemes,
  setTheme,
  labels,
}: Props) {
  const getThemeLabel = (mode: ThemeMode) => {
    if (language === 'tr') {
      if (mode === 'light') return 'Açık';
      if (mode === 'dark') return 'Koyu';
      return 'Aşırı Koyu';
    }
    if (mode === 'light') return 'Light';
    if (mode === 'dark') return 'Dark';
    return 'Ultra Dark';
  };

  const getThemePreviewClass = (mode: ThemeMode) => `theme-preview ${mode}`;

  return (
    <div className="page-controls">
      <div className="control-group">
        <div className="theme-switch" role="group" aria-label={labels.themeTitle}>
          {allowedThemes.map((mode) => (
            <button
              type="button"
              key={mode}
              className={`theme-option ${theme === mode ? 'active' : ''}`}
              onClick={() => setTheme(mode)}
            >
              <span className={getThemePreviewClass(mode)} aria-hidden="true">
                <span className="theme-preview-top" />
                <span className="theme-preview-bottom" />
              </span>
              <span className="theme-option-label">{getThemeLabel(mode)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
