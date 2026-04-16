import type { LanguageMode } from '../../shared/types/ui';

type WelcomeCopy = {
  badge: string;
  title: string;
  subtitle: string;
  startButton: string;
  loginButton: string;
};

export const welcomePageMockData: Record<LanguageMode, WelcomeCopy> = {
  tr: {
    badge: 'Hoş Geldin',
    title: 'MailMind',
    subtitle: 'E-postalarını sade bir arayüzle yönet. Öncelikli mailleri kaçırmadan hızlıca odaklan.',
    startButton: 'Başla',
    loginButton: 'Giriş Yap',
  },
  en: {
    badge: 'Welcome',
    title: 'MailMind',
    subtitle: 'Manage your emails with a clean interface and stay focused on important messages.',
    startButton: 'Get Started',
    loginButton: 'Sign In',
  },
};
