import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LuBan,
  LuBell,
  LuCalendar,
  LuChartLine,
  LuFilePen,
  LuInbox,
  LuLayoutGrid,
  LuListTodo,
  LuLogOut,
  LuMail,
  LuMailPlus,
  LuSearch,
  LuSend,
  LuSparkles,
  LuServer,
  LuStar,
  LuTrash2,
  LuUserRound,
} from 'react-icons/lu';
import { useUIContext } from '../../shared/context/ui-context';
import { useAuth } from '../../shared/context/auth-context';
import { mailDashboardContent, type MailDashboardCopy } from './page.mock-data';
import { NotificationsBell } from './NotificationsBell';
import { useProposalsCount } from '../../shared/hooks/useProposalsCount';
import './mail-dashboard.css';

function mailNavbarTitle(pathname: string, copy: MailDashboardCopy): string {
  if (pathname.endsWith('/pano')) return copy.navDashboard;
  if (pathname.endsWith('/yildizlilar')) return copy.navStarred;
  if (pathname.endsWith('/takvim')) return copy.navCalendar;
  if (pathname.endsWith('/spam')) return copy.navSpam;
  if (pathname.endsWith('/gonderilen')) return copy.navSent;
  if (pathname.endsWith('/taslaklar')) return copy.navDrafts;
  if (pathname.endsWith('/cop-kutusu')) return copy.navTrash;
  if (pathname.endsWith('/oneriler')) return 'AI Önerileri';
  if (pathname.endsWith('/animsaticilar')) return 'Anımsatıcılar';
  if (pathname.endsWith('/gorevler')) return 'Görevler';
  if (pathname.endsWith('/ai-istatistik')) return 'AI İstatistikleri';
  if (pathname.endsWith('/hesaplar')) return 'Mailbox Hesapları';
  if (pathname.endsWith('/new')) return copy.navNewMail;
  return copy.navGeneralInbox;
}

export function MailLayout() {
  const { language, theme } = useUIContext();
  const copy = mailDashboardContent[language];
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count: proposalsCount } = useProposalsCount();
  const navbarTitle = useMemo(() => mailNavbarTitle(location.pathname, copy), [location.pathname, copy]);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!profileWrapRef.current) return;
      if (!profileWrapRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setProfileMenuOpen(false);
    }
  };

  return (
    <div className={`mail-dash-page theme-${theme}`}>
      <header className="mail-dash-navbar">
        <div className="mail-dash-navbar__left">
          <span className="mail-dash-navbar__logo" aria-hidden>
            <LuMail size={22} />
          </span>
          <span className="mail-dash-navbar__product">MailMind</span>
          <span className="mail-dash-navbar__sep" aria-hidden>
            /
          </span>
          <h1 className="mail-dash-navbar__title">{navbarTitle}</h1>
        </div>
        <div className="mail-dash-navbar__search">
          <label className="mail-dash-navbar__search-field">
            <span className="mail-dash-navbar__search-icon" aria-hidden>
              <LuSearch size={18} />
            </span>
            <input
              type="search"
              className="mail-dash-navbar__search-input"
              placeholder={copy.navSearchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              aria-label={copy.navSearchPlaceholder}
            />
          </label>
        </div>
        <div className="mail-dash-navbar__right">
          <NotificationsBell />
          <div className="mail-dash-navbar__profile-wrap" ref={profileWrapRef}>
            <button
              type="button"
              className="mail-dash-navbar__profile"
              aria-label={copy.navProfile}
              title={copy.navProfile}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <LuUserRound size={22} aria-hidden />
            </button>
            {profileMenuOpen && (
              <div className="mail-dash-navbar__profile-menu" role="menu">
                {user && (
                  <div className="mail-dash-navbar__profile-email" title={user.email}>
                    {user.email}
                  </div>
                )}
                <button
                  type="button"
                  role="menuitem"
                  className="mail-dash-navbar__profile-action"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LuLogOut size={16} aria-hidden />
                  {copy.navLogout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mail-dash-body">
        <aside className="mail-dash-sidebar" aria-label={copy.sidebarBrand}>
          <div className="mail-dash-sidebar__brand">
            <span className="mail-dash-sidebar__logo" aria-hidden>
              <LuLayoutGrid size={18} />
            </span>
            <span className="mail-dash-sidebar__title">{copy.mailSidebarTitle}</span>
          </div>
          <NavLink
            to="/mail/new"
            className={({ isActive }) =>
              `mail-dash-sidebar__new-mail ${isActive ? 'mail-dash-sidebar__new-mail--active' : ''}`
            }
          >
            <LuMailPlus size={18} strokeWidth={2} aria-hidden />
            {copy.navNewMail}
          </NavLink>
          <nav className="mail-dash-sidebar__nav">
            <NavLink
              to="/mail/pano"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuLayoutGrid size={18} aria-hidden />
              {copy.navDashboard}
            </NavLink>
            <NavLink
              to="/mail"
              end
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuInbox size={18} aria-hidden />
              {copy.navGeneralInbox}
            </NavLink>
            <NavLink
              to="/mail/yildizlilar"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuStar size={18} aria-hidden />
              {copy.navStarred}
            </NavLink>
            <NavLink
              to="/mail/takvim"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuCalendar size={18} aria-hidden />
              {copy.navCalendar}
            </NavLink>
            <NavLink
              to="/mail/oneriler"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuSparkles size={18} aria-hidden />
              <span className="mail-dash-sidebar__link-label">AI Önerileri</span>
              {proposalsCount.total > 0 && (
                <span className="mail-dash-sidebar__link-badge">
                  {proposalsCount.total > 99 ? '99+' : proposalsCount.total}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/mail/animsaticilar"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuBell size={18} aria-hidden />
              Anımsatıcılar
            </NavLink>
            <NavLink
              to="/mail/gorevler"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuListTodo size={18} aria-hidden />
              Görevler
            </NavLink>
            <NavLink
              to="/mail/ai-istatistik"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuChartLine size={18} aria-hidden />
              AI İstatistik
            </NavLink>
            <NavLink
              to="/mail/hesaplar"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuServer size={18} aria-hidden />
              Hesaplar
            </NavLink>
            <NavLink
              to="/mail/spam"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuBan size={18} aria-hidden />
              {copy.navSpam}
            </NavLink>
            <NavLink
              to="/mail/gonderilen"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuSend size={18} aria-hidden />
              {copy.navSent}
            </NavLink>
            <NavLink
              to="/mail/taslaklar"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuFilePen size={18} aria-hidden />
              {copy.navDrafts}
            </NavLink>
            <NavLink
              to="/mail/cop-kutusu"
              className={({ isActive }) =>
                `mail-dash-sidebar__link ${isActive ? 'mail-dash-sidebar__link--active' : ''}`
              }
            >
              <LuTrash2 size={18} aria-hidden />
              {copy.navTrash}
            </NavLink>
          </nav>
        </aside>

        <Outlet />
      </div>
    </div>
  );
}
