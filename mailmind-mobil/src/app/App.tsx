import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthSplitScreen } from '../screens/auth/AuthSplitScreen';

/** Ana ekran (#0b1220) ile uyumlu, biraz daha koyu sistem navigasyon çubuğu */
const ANDROID_NAV_BAR_BG = '#020617';

export function MobileApp() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void (async () => {
      await NavigationBar.setBackgroundColorAsync(ANDROID_NAV_BAR_BG);
      await NavigationBar.setButtonStyleAsync('light');
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthSplitScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
