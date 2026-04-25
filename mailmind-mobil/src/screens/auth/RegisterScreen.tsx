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
  onGoToLogin: () => void;
};

export function RegisterScreen({ onGoToLogin }: Props) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const copy = authPageMockData[authPageSettings.defaultLanguage].register;
  const footerCopy = authPageMockData[authPageSettings.defaultLanguage].switchToLogin;

  const [name, setName] = useState('');
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
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    setSubmitting(true);
    try {
      await register(normalizedEmail, password);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Kayıt başarısız. Tekrar dene.';
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

          <Text style={s.label}>{copy.name.toUpperCase()}</Text>
          <TextInput
            style={s.input}
            placeholder="Gökhan Güçlü"
            placeholderTextColor={authColors.placeholder}
            value={name}
            onChangeText={setName}
            editable={!submitting}
          />

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
            placeholder="En az 8 karakter"
            placeholderTextColor={authColors.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            onSubmitEditing={handleSubmit}
          />

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
            <Pressable onPress={onGoToLogin} hitSlop={8} disabled={submitting}>
              <Text style={s.footerLink}>{footerCopy.cta}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
