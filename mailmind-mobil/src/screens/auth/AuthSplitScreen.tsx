import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authSplitStyles } from './styles';

const { height } = Dimensions.get('window');

/** Kapalı ↔ açık arası dikey kayma mesafesi (0.92h → 0.08h) */
const PANEL_DRAG_RANGE = height * (0.92 - 0.08);
const TAP_MOVE_THRESHOLD = 10;
/** px/s — RNGH hız birimi */
const FLING_VELOCITY_Y = 520;

export function AuthSplitScreen() {
  const insets = useSafeAreaInsets();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(0);
  const dragStartProgress = useRef(0);

  useEffect(() => {
    const id = animValue.addListener(({ value }) => {
      progressRef.current = value;
    });
    return () => animValue.removeListener(id);
  }, [animValue]);

  const springTo = useCallback((toValue: number) => {
    Animated.spring(animValue, {
      toValue,
      friction: 10,
      tension: 50,
      useNativeDriver: true,
    }).start();
    setIsRegisterMode(toValue === 1);
  }, [animValue]);

  const toggleMode = useCallback(() => {
    setIsRegisterMode((prev) => {
      const next = !prev;
      Animated.spring(animValue, {
        toValue: next ? 1 : 0,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [animValue]);

  const panelPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onStart(() => {
          animValue.stopAnimation();
          dragStartProgress.current = progressRef.current;
        })
        .onUpdate((e) => {
          const next = Math.max(
            0,
            Math.min(1, dragStartProgress.current - e.translationY / PANEL_DRAG_RANGE),
          );
          animValue.setValue(next);
        })
        .onEnd((e) => {
          if (
            Math.abs(e.translationY) < TAP_MOVE_THRESHOLD &&
            Math.abs(e.translationX) < TAP_MOVE_THRESHOLD
          ) {
            toggleMode();
            return;
          }
          const next = Math.max(
            0,
            Math.min(1, dragStartProgress.current - e.translationY / PANEL_DRAG_RANGE),
          );
          let snap = next >= 0.5 ? 1 : 0;
          if (Math.abs(e.velocityY) > FLING_VELOCITY_Y) {
            snap = e.velocityY < 0 ? 1 : 0;
          }
          springTo(snap);
        }),
    [animValue, springTo, toggleMode],
  );

  // 0.92: Panel kapalıyken ekranın sadece %8'i görünür (Tam en dipte)
  // 0.08: Panel açıkken ekranın tepesinde %8 boşluk bırakır
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.92, height * 0.08], 
  });

  return (
    <View style={authSplitStyles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authSplitStyles.flex1}
      >
        {/* --- ARKA PLAN: GİRİŞ FORMU --- */}
        <View style={authSplitStyles.loginContent}>
          <Text style={authSplitStyles.title}>Giriş Yap</Text>
          <Text style={authSplitStyles.subtitle}>MailMind'a tekrar hoş geldin.</Text>

          <View style={authSplitStyles.formGroup}>
            <Text style={authSplitStyles.label}>E-POSTA</Text>
            <TextInput
              style={authSplitStyles.input}
              placeholder="mail@example.com"
              placeholderTextColor="#475569"
              autoCapitalize="none"
            />

            <Text style={authSplitStyles.label}>ŞİFRE</Text>
            <TextInput
              style={authSplitStyles.input}
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor="#475569"
            />

            <Pressable style={authSplitStyles.primaryButton}>
              <Text style={authSplitStyles.buttonText}>Giriş Yap</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View style={[authSplitStyles.slidingPanel, { transform: [{ translateY }] }]}>
          <GestureDetector gesture={panelPanGesture}>
            <View style={authSplitStyles.panelHandle} collapsable={false}>
              <View style={authSplitStyles.handleBar} />
              <View style={authSplitStyles.handleTextRow}>
                <Text style={authSplitStyles.handleText} pointerEvents="none">
                  {isRegisterMode ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
                </Text>
                <Text style={authSplitStyles.handleAction} pointerEvents="none">
                  {isRegisterMode ? ' GİRİŞ' : ' KAYIT OL'}
                </Text>
              </View>
            </View>
          </GestureDetector>

          <View
            style={[
              authSplitStyles.registerBody,
              { paddingBottom: Math.max(insets.bottom, 12) + 24 },
            ]}
          >
            <Text style={authSplitStyles.regTitle}>Yeni Hesap Oluştur</Text>
            <Text style={authSplitStyles.regSubtitle}>Hızlıca topluluğumuza katıl.</Text>

            <Text style={authSplitStyles.label}>AD SOYAD</Text>
            <TextInput style={authSplitStyles.input} placeholder="Gökhan Güçlü" placeholderTextColor="#475569" />

            <Text style={authSplitStyles.label}>E-POSTA</Text>
            <TextInput
              style={authSplitStyles.input}
              placeholder="mail@example.com"
              placeholderTextColor="#475569"
              autoCapitalize="none"
            />

            <Text style={authSplitStyles.label}>ŞİFRE</Text>
            <TextInput style={authSplitStyles.input} secureTextEntry placeholder="••••••" placeholderTextColor="#475569" />

            <Pressable style={[authSplitStyles.primaryButton, authSplitStyles.primaryButtonAccent]}>
              <Text style={authSplitStyles.buttonText}>Kaydı Tamamla</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}