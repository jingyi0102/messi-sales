import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components';
import { useAuth } from '../store';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

export function LoginScreen() {
  const { login, isAuthLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Missing details', 'Enter your username and password.');
      return;
    }
    setSubmitting(true);
    try {
      const success = await login(username, password);
      if (!success) Alert.alert('Login failed', 'Incorrect username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/MESSI_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Use your assigned MESSI Sales account.</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />

          <PrimaryButton
            label="Sign In"
            onPress={handleLogin}
            loading={submitting}
            style={styles.button}
          />

          <Text style={styles.firstRun}>
            First login: admin / admin123
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1, justifyContent: 'center' },
  content: { padding: spacing.xl, maxWidth: 460, width: '100%', alignSelf: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logo: { width: 160, height: 64, alignSelf: 'center', marginBottom: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  button: { marginTop: spacing.sm },
  firstRun: { marginTop: spacing.lg, textAlign: 'center', color: colors.textMuted, fontSize: fontSize.xs },
});
