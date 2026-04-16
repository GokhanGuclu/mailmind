import { Link } from 'react-router-dom';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2.js';
import Lock from 'lucide-react/dist/esm/icons/lock.js';
import Search from 'lucide-react/dist/esm/icons/search.js';
import { useUIContext } from '../../shared/context/ui-context';
import { PageFooter } from '../../shared/components/PageFooter';
import { TopLanguageSwitch } from '../../shared/components/TopLanguageSwitch';
import { homePageContent } from './page.mock-data';
import './styles.css';

export function HomePage() {
  const { language, theme, setLanguage, setTheme } = useUIContext();
  const content = homePageContent[language];

  return (
    <main className={`page home-page theme-${theme}`}>
      <TopLanguageSwitch language={language} theme={theme} setLanguage={setLanguage} setTheme={setTheme} />
      <div className="home-card-wrap">
        <section className="home-card home-card-hero">
          <div className="home-main">
            <h1 className="home-main-title">
              <span className="home-main-title-part">{content.heroTitleBefore}</span>{' '}
              <span className="home-main-title-accent">{content.heroTitleHighlight}</span>
              {content.heroTitleAfter ? (
                <>
                  {' '}
                  <span className="home-main-title-part">{content.heroTitleAfter}</span>
                </>
              ) : null}
            </h1>
            <p className="home-hero-lead">{content.heroLead}</p>

            <div className="home-actions">
              <Link to="/register" className="home-btn primary">
                {content.primaryCta}
              </Link>
              <Link to="/login" className="home-btn secondary">
                {content.secondaryCta}
              </Link>
            </div>
          </div>
        </section>

        <section className="home-card home-section home-why" aria-labelledby="home-why-heading">
          <h2 id="home-why-heading" className="home-why-heading">
            {content.whyTitle}
          </h2>
          <p className="home-why-lead">{content.whyLead}</p>

          <div className="home-features">
            <article className="home-feature-card">
              <div className="home-feature-icon-wrap home-feature-icon-wrap--a">
                <CheckCircle2 className="home-feature-icon" size={24} strokeWidth={2} />
              </div>
              <h3 className="home-feature-card-title">{content.featureOneTitle}</h3>
              <p className="home-feature-card-desc">{content.featureOneDesc}</p>
            </article>
            <article className="home-feature-card">
              <div className="home-feature-icon-wrap home-feature-icon-wrap--b">
                <Search className="home-feature-icon" size={24} strokeWidth={2} />
              </div>
              <h3 className="home-feature-card-title">{content.featureTwoTitle}</h3>
              <p className="home-feature-card-desc">{content.featureTwoDesc}</p>
            </article>
            <article className="home-feature-card">
              <div className="home-feature-icon-wrap home-feature-icon-wrap--c">
                <Lock className="home-feature-icon" size={24} strokeWidth={2} />
              </div>
              <h3 className="home-feature-card-title">{content.featureThreeTitle}</h3>
              <p className="home-feature-card-desc">{content.featureThreeDesc}</p>
            </article>
          </div>
        </section>

        <section className="home-cta-strip" aria-labelledby="home-cta-heading">
          <h2 id="home-cta-heading" className="home-cta-title">
            {content.ctaTitle}
          </h2>
          <p className="home-cta-lead">{content.ctaLead}</p>
          <Link to="/register" className="home-btn home-btn-cta-inverse">
            {content.ctaButton}
          </Link>
        </section>

      </div>

      <PageFooter language={language} />
    </main>
  );
}
