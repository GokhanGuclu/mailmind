import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Text, View } from 'react-native';
import { AppButton } from '../../shared/components/AppButton';
import { welcomePageMockData } from './page.mock-data';
import { welcomePageSettings } from './page.settings';
import { welcomeStyles as styles } from './styles';

type WelcomeScreenProps = {
  onStartPress?: () => void;
  onLoginPress?: () => void;
};

export function WelcomeScreen({ onStartPress, onLoginPress }: WelcomeScreenProps) {
  const language = welcomePageSettings.defaultLanguage;
  const content = welcomePageMockData[language];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.card}>
        <Text style={styles.badge}>{content.badge}</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>

        <View style={styles.actions}>
          <AppButton label={content.startButton} onPress={onStartPress} />
          <AppButton label={content.loginButton} variant="secondary" onPress={onLoginPress} />
        </View>
      </View>
    </SafeAreaView>
  );
}
