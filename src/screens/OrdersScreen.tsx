/**
 * screens/OrdersScreen.tsx
 * Filterable, searchable list of orders for the selected month.
 * EXTENSION POINT: replace state.orders with a paginated SQLite query in Round 2.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Card, EmptyState } from '../components';
import { useAppStore, useAuth } from '../store';
import { formatAmountShort } from '../utils/format';
import { getMonthKey, monthKeyToLabel, extractMonthKeys, formatDateDisplay } from '../utils/date';
import type { Order } from '../types/order';
import type { OrdersListScreenProps } from '../types/navigation';

function monthOnlyLabel(key: string): string {
  return monthKeyToLabel(key).split(' ')[0] ?? key;
}

export function OrdersScreen({ navigation, route }: OrdersListScreenProps) {
  const { state, dispatch } = useAppStore();
  const { currentUser } = useAuth();
  const { orders, selectedMonthKey, salespeople } = state;
  const visibleOrders = useMemo(() => {
    if (currentUser?.role === 'salesman') {
      return orders.filter((order) => order.salesperson === currentUser.displayName);
    }
    if (currentUser?.role === 'driver') {
      return orders.filter((order) => order.driver === currentUser.displayName);
    }
    return orders;
  }, [currentUser, orders]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('All');

  useEffect(() => {
    if (!route.params?.resetFilters) return;
    setSearchQuery('');
    setSelectedEmployee('All');
    navigation.setParams({ resetFilters: false });
  }, [navigation, route.params?.resetFilters]);

  const monthKeys = useMemo(
    () => extractMonthKeys(visibleOrders.map((o) => o.date)),
    [visibleOrders],
  );

  const employeeOptions = useMemo(() => {
    const savedNames = salespeople.map((p) => p.name).filter(Boolean);
    const orderNames = visibleOrders.map((o) => o.salesperson).filter(Boolean);
    const names = [...new Set([...savedNames, ...orderNames])];
    return currentUser?.role === 'admin' ? ['All', ...names] : ['All'];
  }, [currentUser, salespeople, visibleOrders]);

  const monthOrders = useMemo(
    () => visibleOrders.filter((o) => getMonthKey(o.date) === selectedMonthKey),
    [selectedMonthKey, visibleOrders],
  );

  const employeeOrders = useMemo(() => {
    if (selectedEmployee === 'All') return monthOrders;
    return monthOrders.filter((o) => o.salesperson === selectedEmployee);
  }, [monthOrders, selectedEmployee]);

  const employeeStats = useMemo(
    () => ({
      totalSales: employeeOrders.reduce((sum, o) => sum + o.amount, 0),
      totalProfit: employeeOrders.reduce((sum, o) => sum + o.profit, 0),
      outstanding: employeeOrders.reduce((sum, o) => sum + o.balance, 0),
      orderCount: employeeOrders.length,
    }),
    [employeeOrders],
  );

  const filteredOrders = useMemo(() => {
    let list = employeeOrders;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.salesperson.toLowerCase().includes(q) ||
          o.driver.toLowerCase().includes(q),
      );
    }
    return list;
  }, [employeeOrders, searchQuery]);

  const renderItem = ({ item }: { item: Order }) => {
    const bal = item.balance;
    const isPaid = bal <= 0;
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        activeOpacity={0.75}
      >
        <Card padded={false} style={styles.orderCard}>
          <View style={styles.orderTop}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderNo}>{item.orderNo}</Text>
              <View style={styles.slmTag}>
                <Text style={styles.slmTagText}>{item.salesperson || '—'}</Text>
              </View>
            </View>
            <Text style={styles.orderAmount}>{formatAmountShort(item.amount)}</Text>
          </View>
          <View style={styles.orderBottom}>
            <Text style={styles.orderMeta}>
              {formatDateDisplay(item.date)}
              {item.driver ? ` · ${item.driver}` : ''}
            </Text>
            <View style={[styles.balTag, isPaid && styles.balTagPaid]}>
              <Text style={[styles.balTagText, isPaid && styles.balTagTextPaid]}>
                {isPaid ? '✓ Paid' : `Bal: ${formatAmountShort(bal)}`}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Orders</Text>
            <Text style={styles.subtitle}>{monthKeyToLabel(selectedMonthKey)}</Text>
          </View>
        </View>

        {currentUser?.role === 'admin' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.employeeScroll}
            contentContainerStyle={styles.employeeRow}
          >
            {employeeOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.employeeChip, selectedEmployee === opt && styles.employeeChipActive]}
                onPress={() => setSelectedEmployee(opt)}
              >
                <Text
                  style={[
                    styles.employeeChipText,
                    selectedEmployee === opt && styles.employeeChipTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Month bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthBar}
        >
          {monthKeys.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.monthPill,
                key === selectedMonthKey && styles.monthPillActive,
              ]}
              onPress={() => dispatch({ type: 'SET_MONTH', payload: key })}
            >
              <Text
                style={[
                  styles.monthPillText,
                  key === selectedMonthKey && styles.monthPillTextActive,
                ]}
              >
                {monthOnlyLabel(key)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {currentUser?.role !== 'driver' && <View style={styles.performanceCard}>
          <View style={styles.performanceTop}>
            <Text style={styles.performanceName}>
              {selectedEmployee === 'All' ? 'All Salespeople' : selectedEmployee}
            </Text>
            <Text style={styles.performanceCount}>{employeeStats.orderCount} orders</Text>
          </View>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Sales</Text>
              <Text style={styles.performanceValue}>{formatAmountShort(employeeStats.totalSales)}</Text>
            </View>
            {currentUser?.role === 'admin' && <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Profit</Text>
              <Text style={[styles.performanceValue, { color: colors.success }]}>
                {formatAmountShort(employeeStats.totalProfit)}
              </Text>
            </View>}
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Outstanding</Text>
              <Text style={[styles.performanceValue, { color: colors.warning }]}>
                {formatAmountShort(employeeStats.outstanding)}
              </Text>
            </View>
          </View>
        </View>}

        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search BM#, name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="No orders found"
            subtitle="Try adjusting your search or month filter"
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: spacing.sm,
  },
  titleRow: { marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textMuted, marginTop: 2 },
  employeeScroll: { marginBottom: spacing.sm },
  employeeRow: { gap: spacing.xs },
  employeeChip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  employeeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  employeeChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary },
  employeeChipTextActive: { color: colors.textInverse },
  monthBar: { gap: spacing.sm, paddingVertical: 2, marginBottom: spacing.sm },
  monthPill: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  monthPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthPillText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  monthPillTextActive: { color: colors.textInverse },
  performanceCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  performanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  performanceName: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  performanceCount: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textMuted },
  performanceGrid: { flexDirection: 'row', gap: spacing.sm },
  performanceItem: { flex: 1 },
  performanceLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  performanceValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  searchRow: { gap: spacing.sm },
  searchInput: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.textPrimary, borderWidth: 1.5, borderColor: colors.border },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxxl },
  orderCard: { marginBottom: spacing.sm },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.xs },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orderNo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  slmTag: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  slmTagText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
  orderAmount: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.textPrimary },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  orderMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  balTag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.warningLight },
  balTagPaid: { backgroundColor: colors.successLight },
  balTagText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.warning },
  balTagTextPaid: { color: colors.success },
});
