import type { LanguageMode } from '../../shared/types/ui';

type AuthCopy = {
  login: {
    title: string;
    subtitle: string;
    reveal: string;
    email: string;
    password: string;
    submit: string;
  };
  register: {
    title: string;
    subtitle: string;
    reveal: string;
    name: string;
    email: string;
    password: string;
    submit: string;
  };
  switchToLogin: {
    title: string;
    subtitle: string;
    cta: string;
  };
  switchToRegister: {
    title: string;
    subtitle: string;
    cta: string;
  };
};

export const authPageMockData: Record<LanguageMode, AuthCopy> = {
  tr: {
    login: {
      title: 'Giriş Yap',
      subtitle: 'Hesabına hızlıca geri dön.',
      reveal: 'Formu Aç',
      email: 'E-posta',
      password: 'Şifre',
      submit: 'Giriş Yap',
    },
    register: {
      title: 'Kayıt Ol',
      subtitle: 'Yeni hesabını birkaç adımda oluştur.',
      reveal: 'Formu Aç',
      name: 'Ad Soyad',
      email: 'E-posta',
      password: 'Şifre',
      submit: 'Kayıt Ol',
    },
    switchToLogin: {
      title: 'Zaten hesabın var mı?',
      subtitle: 'Devam etmek için giriş ekranına geç.',
      cta: 'Girişe Geç',
    },
    switchToRegister: {
      title: 'Hesabın yok mu?',
      subtitle: 'Yeni bir hesap oluşturmak için kayıt ekranına geç.',
      cta: 'Kayıta Geç',
    },
  },
  en: {
    login: {
      title: 'Sign In',
      subtitle: 'Get back to your account quickly.',
      reveal: 'Open Form',
      email: 'Email',
      password: 'Password',
      submit: 'Sign In',
    },
    register: {
      title: 'Register',
      subtitle: 'Create your account in a few steps.',
      reveal: 'Open Form',
      name: 'Full Name',
      email: 'Email',
      password: 'Password',
      submit: 'Register',
    },
    switchToLogin: {
      title: 'Already have an account?',
      subtitle: 'Move to login to continue.',
      cta: 'Go to Login',
    },
    switchToRegister: {
      title: "Don't have an account?",
      subtitle: 'Move to register and create a new account.',
      cta: 'Go to Register',
    },
  },
};
