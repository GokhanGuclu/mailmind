type RegisterText = {
  title: string;
  subtitle: string;
  nameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  submitButton: string;
  goLogin: string;
  languageTitle: string;
  themeTitle: string;
};

export const registerPageContent: Record<'tr' | 'en', RegisterText> = {
  tr: {
    title: 'Kayıt Ol',
    subtitle: 'Yeni hesabını oluştur ve gelen kutuna bağlan.',
    nameLabel: 'Ad Soyad',
    emailLabel: 'E-posta',
    passwordLabel: 'Şifre',
    submitButton: 'Kayıt',
    goLogin: 'Zaten hesabın var mı? Giriş yap',
    languageTitle: 'Dil',
    themeTitle: 'Tema',
  },
  en: {
    title: 'Register',
    subtitle: 'Create your account and connect your inbox.',
    nameLabel: 'Full Name',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitButton: 'Create Account',
    goLogin: 'Already have an account? Login',
    languageTitle: 'Language',
    themeTitle: 'Theme',
  },
};

export const registerFormDefaults = {
  fullName: '',
  email: 'name@example.com',
  password: '',
};
