/**
 * screens/DashboardScreen.tsx
 * Month picker header, MESSI logo, monthly summary stats, salesperson performance.
 */

import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { StatCard, Card, EmptyState, MonthPickerModal } from '../components';
import { useAppStore, useAuth } from '../store';
import { summariseOrders } from '../utils/calculation';
import { formatAmountShort } from '../utils/format';
import { getMonthKey, monthKeyToLabel } from '../utils/date';
import type { DashboardScreenProps } from '../types/navigation';

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { state, dispatch } = useAppStore();
  const { currentUser } = useAuth();
  const { orders, selectedMonthKey, isLoading } = state;

  const monthOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          getMonthKey(o.date) === selectedMonthKey &&
          (currentUser?.role !== 'salesman' || o.salesperson === currentUser.displayName),
      ),
    [currentUser, orders, selectedMonthKey],
  );

  const summary = useMemo(() => {
    const s = summariseOrders(monthOrders);
    return { ...s, monthKey: selectedMonthKey };
  }, [monthOrders, selectedMonthKey]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Month picker */}
          <MonthPickerModal
            selectedKey={selectedMonthKey}
            onChange={(key) => dispatch({ type: 'SET_MONTH', payload: key })}
          />

          {/* Logo */}
          <Image
            source={require('../../assets/MESSI_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Admin button */}
          {currentUser?.role === 'admin' && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => navigation.navigate('Admin')}
            >
              <Text style={styles.adminIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statGrid}>
          <StatCard label="Total Sales" value={formatAmountShort(summary.totalSales)} sub={`${summary.orderCount} orders`} />
          {currentUser?.role === 'admin' && (
            <StatCard label="Total Profit" value={formatAmountShort(summary.totalProfit)} valueColor={colors.success} />
          )}
        </View>
        <View style={styles.statGrid}>
          {currentUser?.role === 'admin' && (
            <StatCard label="Total Cost" value={formatAmountShort(summary.totalCost)} valueColor={colors.textSecondary} />
          )}
          <StatCard label="Outstanding" value={formatAmountShort(summary.totalOutstanding)} valueColor={colors.warning} />
        </View>

        {currentUser?.role === 'admin' && summary.bysalesperson.length > 0 && (
          <Card padded={false} style={styles.perfCard}>
            <Text style={styles.sectionTitle}>Salesperson Performance</Text>
            {summary.bysalesperson.map((sp) => {
              const pct = summary.totalSales > 0 ? (sp.totalSales / summary.totalSales) * 100 : 0;
              return (
                <View key={sp.name} style={styles.spRow}>
                  <View style={styles.spRowTop}>
                    <View style={styles.spLeft}>
                      <View style={styles.spTag}>
                        <Text style={styles.spTagText}>{sp.name}</Text>
                      </View>
                      <Text style={styles.spOrders}>{sp.orderCount} orders</Text>
                    </View>
                    <View style={styles.spRight}>
                      <Text style={styles.spSales}>{formatAmountShort(sp.totalSales)}</Text>
                      <Text style={styles.spProfit}>+{formatAmountShort(sp.totalProfit)}</Text>
                    </View>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {monthOrders.length === 0 && !isLoading && (
          <EmptyState
            icon="📋"
            title={`No orders for ${monthKeyToLabel(selectedMonthKey)}`}
            subtitle="Tap + to record the first order"
          />
        )}

        <TouchableOpacity style={styles.deliveryBanner} onPress={() => navigation.navigate('Delivery')}>
          <View>
            <Text style={styles.deliveryTitle}>🚚 Delivery Management</Text>
            <Text style={styles.deliverySub}>Track pending and completed deliveries</Text>
          </View>
          <Text style={styles.deliveryArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 110,
    height: 40,
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -55 }],
  },
  adminBtn: {
    marginLeft: 'auto',
    width: 58,
    height: 58,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminIcon: { fontSize: 18 },

  body: { flex: 1 },
  bodyContent: { padding: spacing.base, paddingBottom: spacing.xxxl },
  statGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },

  perfCard: { marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  spRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  spRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  spLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  spTag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  spTagText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
  spOrders: { fontSize: fontSize.xs, color: colors.textMuted },
  spRight: { alignItems: 'flex-end' },
  spSales: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  spProfit: { fontSize: fontSize.xs, color: colors.success },
  barBg: { height: 3, backgroundColor: colors.border, borderRadius: radius.full },
  barFill: { height: 3, backgroundColor: colors.primary, borderRadius: radius.full },

  deliveryBanner: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  deliveryTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary, marginBottom: 2 },
  deliverySub: { fontSize: fontSize.xs, color: colors.textLink },
  deliveryArrow: { fontSize: 22, color: colors.primary },
});
