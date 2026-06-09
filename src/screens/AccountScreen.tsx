import React from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, Card, PrimaryButton } from '../components';
import { useAuth } from '../store';
import { colors, fontSize, fontWeight, spacing } from '../theme';

export function AccountScreen() {
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
      return;
    }
    Alert.alert('Sign out', 'Sign out of this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="My Account" />
      <View style={styles.content}>
        <Card>
          <Text style={styles.name}>{currentUser?.displayName}</Text>
          <Text style={styles.username}>@{currentUser?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{currentUser?.role.toUpperCase()}</Text>
          </View>
        </Card>
        <PrimaryButton label="Sign Out" variant="outline" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  username: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  roleText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
});
