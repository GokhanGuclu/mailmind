import type { LanguageMode } from '../types/ui';

type Props = {
  language: LanguageMode;
};

export function PageFooter(props: Props) {
  const footerText =
    props.language === 'tr'
      ? 'Gelen kutusu ve iş akışı için tek ekran.'
      : 'One screen for inbox and workflow.';

  const copyright =
    props.language === 'tr'
      ? '© 2026 MailMind. Tüm hakları saklıdır.'
      : '© 2026 MailMind. All rights reserved.';

  return (
    <footer className="page-footer">
      <div className="page-footer-left">
        <div className="page-footer-meta">
          <strong>MailMind</strong>
          <span>{footerText}</span>
        </div>
      </div>
      <p className="page-footer-copyright">{copyright}</p>
    </footer>
  );
}
