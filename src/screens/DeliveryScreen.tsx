/**
 * screens/DeliveryScreen.tsx
 * Placeholder screen for the driver notification system.
 * The interface shape is established here so Round 2 can wire it to real data.
 * EXTENSION POINT: connect delivery status updates, push notifications, route grouping.
 */

import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { AppHeader, Card, EmptyState } from '../components';
import { useAppStore, useAuth } from '../store';
import { orderService } from '../services/orderService';
import { formatAmountShort } from '../utils/format';
import { formatDateDisplay } from '../utils/date';
import type { Order } from '../types/order';
import type { DeliveryScreenProps } from '../types/navigation';

export function DeliveryScreen({ navigation }: DeliveryScreenProps) {
  const { state, dispatch } = useAppStore();
  const { currentUser } = useAuth();

  const pendingDeliveries = useMemo(
    () =>
      state.orders
        .filter(
          (o) =>
            Boolean(o.deliveryDate) &&
            o.deliveryStatus !== 'delivered' &&
            (currentUser?.role === 'admin' ||
              (currentUser?.role === 'driver' && o.driver === currentUser.displayName) ||
              (currentUser?.role === 'salesman' &&
                o.salesperson === currentUser.displayName)),
        )
        .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)),
    [currentUser, state.orders],
  );

  const updateDelivery = async (
    order: Order,
    status: 'out_for_delivery' | 'delivered',
  ) => {
    const updated = await orderService.setDeliveryStatus(order.id, status);
    if (updated) dispatch({ type: 'UPDATE_ORDER', payload: updated });
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() =>
        navigation.navigate('OrdersStack', {
          screen: 'OrderDetail',
          params: { orderId: item.id },
        })
      }
    >
    <Card padded={false} style={styles.deliveryCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.orderNo}>{item.orderNo}</Text>
          <View style={styles.driverTag}>
            <Text style={styles.driverTagText}>{item.driver || 'No driver'}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatAmountShort(item.amount)}</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.meta}>
          Del: {formatDateDisplay(item.deliveryDate)} · Bal: {formatAmountShort(item.balance)}
        </Text>
        <TouchableOpacity
          style={styles.notifyBtn}
          onPress={() => {
            if (currentUser?.role === 'driver') {
              updateDelivery(
                item,
                item.deliveryStatus === 'pending' ? 'out_for_delivery' : 'delivered',
              );
              return;
            }
            Alert.alert('Delivery', `Current status: ${item.deliveryStatus.replaceAll('_', ' ')}`);
          }}
        >
          <Text style={styles.notifyBtnText}>
            {currentUser?.role === 'driver'
              ? item.deliveryStatus === 'pending'
                ? 'Start'
                : 'Complete'
              : item.deliveryStatus.replaceAll('_', ' ')}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Deliveries" />

      {/* Pending deliveries list */}
      <Text style={styles.sectionLabel}>Pending Deliveries</Text>
      <FlatList
        data={pendingDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="🚚"
            title="No pending deliveries"
            subtitle="Orders with outstanding balance and delivery dates will appear here"
          />
        }
        showsVerticalScrollIndicator={false}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.warningLight, borderWidth: 1, borderColor: colors.warning, borderRadius: radius.lg, margin: spacing.md, padding: spacing.md },
  bannerIcon: { fontSize: 20 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.warning },
  bannerSub: { fontSize: fontSize.xs, color: colors.warning, marginTop: 2, lineHeight: 16 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  deliveryCard: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.xs },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orderNo: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
  driverTag: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  driverTagText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  amount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  notifyBtn: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 5 },
  notifyBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
  featuresBox: { backgroundColor: colors.surfaceSecondary, margin: spacing.md, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border },
  featuresTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary, marginBottom: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  soonBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.xs, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  soonBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  featureText: { fontSize: fontSize.xs, color: colors.textSecondary, flex: 1 },
});
