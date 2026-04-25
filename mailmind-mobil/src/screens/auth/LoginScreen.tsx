import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, useAuth } from '../../shared/auth/auth-context';
import { authPageMockData } from './page.mock-data';
import { authPageSettings } from './page.settings';
import { authColors, authStyles as s } from './styles';

type Props = {
  onGoToRegister: () => void;
};

export function LoginScreen({ onGoToRegister }: Props) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const copy = authPageMockData[authPageSettings.defaultLanguage].login;
  const footerCopy = authPageMockData[authPageSettings.defaultLanguage].switchToRegister;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('E-posta ve şifre zorunlu.');
      return;
    }
    setSubmitting(true);
    try {
      await login(normalizedEmail, password);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Giriş başarısız. Tekrar dene.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.brandRow}>
            <View style={s.brandDot} />
            <Text style={s.brandText}>MailMind</Text>
          </View>

          <Text style={s.title}>{copy.title}</Text>
          <Text style={s.subtitle}>{copy.subtitle}</Text>

          <Text style={s.label}>{copy.email.toUpperCase()}</Text>
          <TextInput
            style={s.input}
            placeholder="mail@example.com"
            placeholderTextColor={authColors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />

          <Text style={s.label}>{copy.password.toUpperCase()}</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor={authColors.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            onSubmitEditing={handleSubmit}
          />

          <Pressable style={s.forgotRow}>
            <Text style={s.forgotText}>Şifremi unuttum</Text>
          </Pressable>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [s.primaryButton, pressed && s.pressed, submitting && s.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={authColors.accentText} />
            ) : (
              <Text style={s.primaryButtonText}>{copy.submit}</Text>
            )}
          </Pressable>

          <View style={s.footerRow}>
            <Text style={s.footerText}>{footerCopy.title}</Text>
            <Pressable onPress={onGoToRegister} hitSlop={8} disabled={submitting}>
              <Text style={s.footerLink}>{footerCopy.cta}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
