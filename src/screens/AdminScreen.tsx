/**
 * screens/AdminScreen.tsx
 * Manage salespeople, drivers, and data export.
 * EXTENSION POINT: add export buttons (CSV, PDF) in Round 3.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { AppHeader, Card, PrimaryButton } from '../components';
import { useAppStore } from '../store';
import { peopleService } from '../services/peopleService';
import { authService } from '../services/authService';
import { useAuth } from '../store';
import type { AdminScreenProps } from '../types/navigation';
import type { Account, UserRole } from '../types/auth';

type TabKey = 'accounts' | 'salespeople' | 'drivers' | 'export';

export function AdminScreen({ navigation }: AdminScreenProps) {
  const { state, dispatch } = useAppStore();
  const { currentUser, logout } = useAuth();
  const { salespeople, drivers, orders } = state;
  const [activeTab, setActiveTab] = useState<TabKey>('accounts');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountName, setAccountName] = useState('');
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountRole, setAccountRole] = useState<UserRole>('salesman');

  useEffect(() => {
    authService.getAccounts().then(setAccounts);
  }, []);

  const handleCreateAccount = async () => {
    if (!accountName.trim() || !accountUsername.trim() || accountPassword.length < 6) {
      Alert.alert('Missing details', 'Enter a name, username, and password of at least 6 characters.');
      return;
    }
    setAdding(true);
    try {
      const account = await authService.createAccount({
        displayName: accountName,
        username: accountUsername,
        password: accountPassword,
        role: accountRole,
      });
      setAccounts((current) => [...current, account]);

      if (accountRole === 'salesman' && !salespeople.some((p) => p.name === account.displayName)) {
        const person = await peopleService.addSalesperson(account.displayName);
        dispatch({ type: 'SET_SALESPEOPLE', payload: [...salespeople, person] });
      }
      if (accountRole === 'driver' && !drivers.some((d) => d.name === account.displayName)) {
        const driver = await peopleService.addDriver(account.displayName);
        dispatch({ type: 'SET_DRIVERS', payload: [...drivers, driver] });
      }

      setAccountName('');
      setAccountUsername('');
      setAccountPassword('');
      Alert.alert('Account created', `${account.displayName} can now sign in.`);
    } catch {
      Alert.alert('Unable to create account', 'That username may already be in use.');
    } finally {
      setAdding(false);
    }
  };

  const toggleAccount = async (account: Account) => {
    if (account.id === currentUser?.id) {
      Alert.alert('Not allowed', 'You cannot disable the account currently in use.');
      return;
    }
    await authService.setActive(account.id, !account.isActive);
    setAccounts((current) =>
      current.map((item) =>
        item.id === account.id ? { ...item, isActive: !item.isActive } : item,
      ),
    );
  };

  const resetPassword = (account: Account) => {
    Alert.alert('Reset password', `Reset ${account.displayName}'s password to 123456?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          await authService.resetPassword(account.id, '123456');
          Alert.alert('Password reset', 'Temporary password: 123456');
        },
      },
    ]);
  };

  const handleAddSP = async () => {
    const name = newName.trim().toUpperCase();
    if (!name) return;
    if (salespeople.some((p) => p.name === name)) {
      return Alert.alert('Duplicate', `${name} already exists.`);
    }
    setAdding(true);
    try {
      const person = await peopleService.addSalesperson(name);
      dispatch({ type: 'SET_SALESPEOPLE', payload: [...salespeople, person] });
      setNewName('');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSP = (id: string, name: string) => {
    Alert.alert('Remove', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await peopleService.removeSalesperson(id);
          dispatch({ type: 'SET_SALESPEOPLE', payload: salespeople.filter((p) => p.id !== id) });
        },
      },
    ]);
  };

  const handleAddDR = async () => {
    const name = newName.trim().toUpperCase();
    if (!name) return;
    if (drivers.some((d) => d.name === name)) {
      return Alert.alert('Duplicate', `${name} already exists.`);
    }
    setAdding(true);
    try {
      const driver = await peopleService.addDriver(name);
      dispatch({ type: 'SET_DRIVERS', payload: [...drivers, driver] });
      setNewName('');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveDR = (id: string, name: string) => {
    Alert.alert('Remove', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await peopleService.removeDriver(id);
          dispatch({ type: 'SET_DRIVERS', payload: drivers.filter((d) => d.id !== id) });
        },
      },
    ]);
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'accounts', label: 'Accounts' },
    { key: 'salespeople', label: '👤 Sales' },
    { key: 'drivers', label: '🚗 Drivers' },
    { key: 'export', label: '📤 Export' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Admin Panel" />

      {/* Tab row */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => { setActiveTab(t.key); setNewName(''); }}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'accounts' && (
        <View style={styles.body}>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.accountRow, !item.isActive && styles.accountDisabled]}>
                <View style={styles.accountInfo}>
                  <Text style={styles.personName}>{item.displayName}</Text>
                  <Text style={styles.accountMeta}>
                    @{item.username} · {item.role}
                  </Text>
                </View>
                <View style={styles.accountActions}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => resetPassword(item)}>
                    <Text style={styles.smallBtnText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={item.isActive ? styles.removeBtn : styles.enableBtn}
                    onPress={() => toggleAccount(item)}
                  >
                    <Text style={item.isActive ? styles.removeBtnText : styles.enableBtnText}>
                      {item.isActive ? 'Disable' : 'Enable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.accountForm}>
            <View style={styles.roleRow}>
              {(['salesman', 'driver', 'admin'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleChip, accountRole === role && styles.roleChipActive]}
                  onPress={() => setAccountRole(role)}
                >
                  <Text style={[styles.roleChipText, accountRole === role && styles.roleChipTextActive]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.addInput}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Display name"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.addInput}
              value={accountUsername}
              onChangeText={setAccountUsername}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.addInput}
              value={accountPassword}
              onChangeText={setAccountPassword}
              placeholder="Password (6+ characters)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <PrimaryButton label="Create Account" onPress={handleCreateAccount} loading={adding} />
            <PrimaryButton label="Sign Out" variant="ghost" onPress={logout} />
          </View>
        </View>
      )}

      {/* Salespeople tab */}
      {activeTab === 'salespeople' && (
        <View style={styles.body}>
          <FlatList
            data={salespeople}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.personRow}>
                <Text style={styles.personName}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveSP(item.id, item.name)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No salespeople added yet.</Text>
            }
          />
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Add salesperson name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              onSubmitEditing={handleAddSP}
              returnKeyType="done"
            />
            <PrimaryButton label="Add" onPress={handleAddSP} loading={adding} fullWidth={false} style={styles.addBtn} />
          </View>
        </View>
      )}

      {/* Drivers tab */}
      {activeTab === 'drivers' && (
        <View style={styles.body}>
          <FlatList
            data={drivers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.personRow}>
                <Text style={styles.personName}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveDR(item.id, item.name)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No drivers added yet.</Text>
            }
          />
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Add driver name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              onSubmitEditing={handleAddDR}
              returnKeyType="done"
            />
            <PrimaryButton label="Add" onPress={handleAddDR} loading={adding} fullWidth={false} style={styles.addBtn} />
          </View>
        </View>
      )}

      {/* Export tab */}
      {activeTab === 'export' && (
        <View style={styles.body}>
          <Card style={styles.exportCard}>
            <Text style={styles.exportTitle}>📊 CSV / Excel</Text>
            <Text style={styles.exportDesc}>All orders exported as CSV. Open in Excel.</Text>
            <PrimaryButton
              label="Export CSV"
              onPress={() => Alert.alert('Coming in Round 3', 'CSV export will be added in the next build.')}
            />
          </Card>
          <Card style={styles.exportCard}>
            <Text style={styles.exportTitle}>📄 PDF Report</Text>
            <Text style={styles.exportDesc}>Monthly summary with profit breakdown.</Text>
            <PrimaryButton
              label="Export PDF"
              variant="outline"
              onPress={() => Alert.alert('Coming in Round 3', 'PDF export will be added in the next build.')}
            />
          </Card>
          <Card style={styles.statsCard}>
            <Text style={styles.statsText}>
              Total stored:{' '}
              <Text style={styles.statsNum}>{orders.length}</Text> orders
            </Text>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surfaceSecondary, margin: spacing.md, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse },
  body: { flex: 1, paddingHorizontal: spacing.md },
  listContent: { paddingBottom: spacing.xxl },
  personRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xs },
  personName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  removeBtn: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 6 },
  removeBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.danger },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  addRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xl },
  addInput: { flex: 1, backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.textPrimary },
  addBtn: { paddingHorizontal: spacing.lg, minWidth: 70 },
  exportCard: { marginBottom: spacing.sm },
  exportTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  exportDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  statsCard: { backgroundColor: colors.surfaceHighlight, borderColor: colors.primaryLight },
  statsText: { fontSize: fontSize.sm, color: colors.primary },
  statsNum: { fontWeight: fontWeight.bold },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  accountDisabled: { opacity: 0.55 },
  accountInfo: { flex: 1 },
  accountMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  accountActions: { flexDirection: 'row', gap: spacing.xs },
  smallBtn: { backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  smallBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textSecondary },
  enableBtn: { backgroundColor: colors.successLight, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  enableBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.success },
  accountForm: { gap: spacing.sm, paddingBottom: spacing.xl },
  roleRow: { flexDirection: 'row', gap: spacing.xs },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textSecondary },
  roleChipTextActive: { color: colors.textInverse },
});
