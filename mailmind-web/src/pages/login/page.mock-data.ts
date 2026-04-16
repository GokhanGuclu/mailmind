type LoginText = {
  title: string;
  subtitle: string;
  emailLabel: string;
  passwordLabel: string;
  submitButton: string;
  goRegister: string;
  languageTitle: string;
  themeTitle: string;
};

export const loginPageContent: Record<'tr' | 'en', LoginText> = {
  tr: {
    title: 'Giriş Yap',
    subtitle: 'Hesabına e-posta ve şifrenle giriş yap.',
    emailLabel: 'E-posta',
    passwordLabel: 'Şifre',
    submitButton: 'Giriş',
    goRegister: 'Hesabın yok mu? Kayıt ol',
    languageTitle: 'Dil',
    themeTitle: 'Tema',
  },
  en: {
    title: 'Login',
    subtitle: 'Sign in with your email and password.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitButton: 'Sign In',
    goRegister: "Don't have an account? Register",
    languageTitle: 'Language',
    themeTitle: 'Theme',
  },
};

export const loginFormDefaults = {
  email: 'name@example.com',
  password: '',
};
