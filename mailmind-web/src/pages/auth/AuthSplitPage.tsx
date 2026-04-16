import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIContext } from '../../shared/context/ui-context';
import { useAuth } from '../../shared/context/auth-context';
import { ApiError } from '../../shared/api/client';
import { TopLanguageSwitch } from '../../shared/components/TopLanguageSwitch';
import { loginPageContent } from '../login/page.mock-data';
import { registerPageContent } from '../register/page.mock-data';

import './auth-split.css';

export function AuthSplitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, theme, setLanguage, setTheme } = useUIContext();
  const { login, register, status, hasActiveMailbox } = useAuth();
  const loginText = loginPageContent[language];
  const registerText = registerPageContent[language];
  const currentRoutePanel: 'login' | 'register' = location.pathname === '/login' ? 'login' : 'register';
  const [activePanel, setActivePanel] = useState<'login' | 'register'>(currentRoutePanel);
  const [isPageEntered, setIsPageEntered] = useState(false);

  // Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  useEffect(() => {
    setActivePanel(currentRoutePanel);
  }, [currentRoutePanel]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsPageEntered(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  // If already authenticated, bounce away from auth page
  useEffect(() => {
    if (status === 'authenticated') {
      navigate(hasActiveMailbox ? '/mail' : '/connect-email', { replace: true });
    }
  }, [status, hasActiveMailbox, navigate]);

  const switchPanelText = {
    tr: {
      register: { title: 'Hesabın yok mu?', description: 'Yeni hesap oluşturmak için kayıt ekranına geç.', cta: 'Kayıt Ol' },
      login: { title: 'Zaten hesabın var mı?', description: 'Devam etmek için giriş ekranına geç.', cta: 'Giriş Yap' },
    },
    en: {
      register: { title: "Don't have an account?", description: 'Go to registration and create your account.', cta: 'Register' },
      login: { title: 'Already have an account?', description: 'Go to login to continue.', cta: 'Login' },
    },
  } as const;

  const isLoginActive = activePanel === 'login';
  const targetPanel: 'login' | 'register' = isLoginActive ? 'register' : 'login';
  const switchText = switchPanelText[language][targetPanel];
  const shapeOnLeft = !isLoginActive;
  const isLight = theme === 'light';

  const handleSwitch = () => {
    setActivePanel(targetPanel);
    navigate(targetPanel === 'login' ? '/login' : '/register');
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      const result = await login(loginEmail.trim(), loginPassword);
      navigate(result.hasActiveMailbox ? '/mail' : '/connect-email', { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Giriş başarısız';
      setLoginError(message);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSubmitting(true);
    try {
      await register(registerEmail.trim(), registerPassword);
      // Yeni kullanıcının hiç bağlı hesabı yoktur — direkt mail bağlama ekranına
      navigate('/connect-email', { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Kayıt başarısız';
      setRegisterError(message);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const inputClass = `mt-1 h-11 w-full rounded-[4px] border px-3 outline-none transition ${
    isLight
      ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-500'
      : 'border-slate-500 bg-[#0b1220] text-slate-100 focus:border-slate-300'
  }`;

  const labelClass = `block text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`;

  const submitClass = `h-11 w-full rounded-[4px] border font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
    isLight
      ? 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200'
      : 'border-slate-400 bg-[#1e293b] text-slate-100 hover:bg-[#273449]'
  }`;

  return (
    <main className={`page auth-split-page theme-${theme}`}>
      <TopLanguageSwitch language={language} theme={theme} setLanguage={setLanguage} setTheme={setTheme} />
      <section
        className={`relative mx-auto mt-4 grid min-h-[78vh] w-[min(1180px,96%)] grid-cols-2 overflow-hidden rounded-[6px] border transition-all duration-500 ease-out max-[980px]:grid-cols-1 ${
          isLight ? 'border-slate-300 bg-white' : 'border-slate-600/70 bg-[#111827]'
        } ${isPageEntered ? 'translate-y-0 opacity-100' : 'translate-y-[6px] opacity-0'}`}
      >
        <div className={`flex items-center justify-center px-10 py-10 transition-opacity duration-500 ${isLoginActive ? 'opacity-100' : 'opacity-45 max-[980px]:opacity-100'}`}>
          <form onSubmit={handleLoginSubmit} className="w-full max-w-md space-y-4" aria-label="login-form">
            <h1 className="text-3xl font-semibold">{loginText.title}</h1>
            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{loginText.subtitle}</p>
            <label className={labelClass}>
              {loginText.emailLabel}
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </label>
            <label className={labelClass}>
              {loginText.passwordLabel}
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </label>
            {loginError && (
              <p className="text-sm text-red-500" role="alert">
                {loginError}
              </p>
            )}
            <button type="submit" disabled={loginSubmitting} className={submitClass}>
              {loginSubmitting ? '...' : loginText.submitButton}
            </button>
          </form>
        </div>

        <div className={`flex items-center justify-center px-10 py-10 transition-opacity duration-500 ${!isLoginActive ? 'opacity-100' : 'opacity-45 max-[980px]:opacity-100'}`}>
          <form onSubmit={handleRegisterSubmit} className="w-full max-w-md space-y-4" aria-label="register-form">
            <h1 className="text-3xl font-semibold">{registerText.title}</h1>
            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{registerText.subtitle}</p>
            <label className={labelClass}>
              {registerText.emailLabel}
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </label>
            <label className={labelClass}>
              {registerText.passwordLabel}
              <input
                type="password"
                required
                minLength={8}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </label>
            {registerError && (
              <p className="text-sm text-red-500" role="alert">
                {registerError}
              </p>
            )}
            <button type="submit" disabled={registerSubmitting} className={submitClass}>
              {registerSubmitting ? '...' : registerText.submitButton}
            </button>
          </form>
        </div>

        <aside
          className={`absolute inset-y-0 z-10 flex w-[54%] items-center justify-center border-y px-8 text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] max-[980px]:relative max-[980px]:inset-auto max-[980px]:order-first max-[980px]:w-full max-[980px]:rounded-none max-[980px]:border-x-0 ${
            isLight ? 'border-slate-300 bg-slate-200' : 'border-slate-500/80 bg-[#1f2937]'
          } ${
            shapeOnLeft
              ? 'left-0 rounded-r-[46%_52%] border-r border-l-0'
              : 'left-[46%] rounded-l-[46%_52%] border-l border-r-0'
          }`}
        >
          <div className="mx-auto max-w-xs">
            <h2 className="text-3xl font-semibold">{switchText.title}</h2>
            <p className={`mt-3 text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{switchText.description}</p>
            <button
              type="button"
              onClick={handleSwitch}
              className={`mt-6 h-11 w-full rounded-[4px] border font-semibold transition active:scale-[0.99] ${
                isLight
                  ? 'border-slate-400 bg-white text-slate-900 hover:bg-slate-100'
                  : 'border-slate-300 bg-[#0f172a] text-slate-100 hover:bg-[#1e293b]'
              }`}
            >
              {switchText.cta}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
