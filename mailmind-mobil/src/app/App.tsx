import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthScreen } from '../screens/auth/AuthScreen';
import { MailNavigator } from '../screens/mail/MailNavigator';
import { AuthProvider, useAuth } from '../shared/auth/auth-context';

function RootSwitch() {
  const { status } = useAuth();
  return status === 'authenticated' ? <MailNavigator /> : <AuthScreen />;
}

export function MobileApp() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Edge-to-edge modunda arkaplan rengi sistem tarafından yönetilir; yalnızca buton stilini ayarla.
    void NavigationBar.setButtonStyleAsync('light').catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootSwitch />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
