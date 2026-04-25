import { useCallback, useState } from 'react';

import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

type Route = 'login' | 'register';

export function AuthScreen() {
  const [route, setRoute] = useState<Route>('login');

  const goToRegister = useCallback(() => setRoute('register'), []);
  const goToLogin = useCallback(() => setRoute('login'), []);

  return route === 'login' ? (
    <LoginScreen onGoToRegister={goToRegister} />
  ) : (
    <RegisterScreen onGoToLogin={goToLogin} />
  );
}
