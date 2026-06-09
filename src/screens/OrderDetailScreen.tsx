/**
 * screens/OrderDetailScreen.tsx
 * Full order detail: payment history timeline, add payment, delete order, edit button.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { AppHeader, Card, PrimaryButton } from '../components';
import { useAppStore, useAuth } from '../store';
import { orderService } from '../services/orderService';
import { formatAmountShort } from '../utils/format';
import { formatDateDisplay } from '../utils/date';
import type { OrderDetailScreenProps } from '../types/navigation';
import type { PaymentType } from '../types/order';

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function OrderDetailScreen({ route, navigation }: OrderDetailScreenProps) {
  const { orderId } = route.params;
  const { state, dispatch } = useAppStore();
  const { currentUser } = useAuth();

  const order = useMemo(() => {
    const found = state.orders.find((o) => o.id === orderId);
    if (!found || !currentUser) return undefined;
    if (currentUser.role === 'admin') return found;
    if (currentUser.role === 'salesman' && found.salesperson === currentUser.displayName) {
      return found;
    }
    if (currentUser.role === 'driver' && found.driver === currentUser.displayName) {
      return found;
    }
    return undefined;
  }, [currentUser, state.orders, orderId]);

  const [showPayForm, setShowPayForm] = useState(false);
  const [payType, setPayType] = useState<PaymentType>('deposit');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader title="Order Detail" onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const balance = order.balance;
  const profit = order.profit;
  const isPaid = balance <= 0;
  const isAdmin = currentUser?.role === 'admin';
  const isAssignedDriver =
    currentUser?.role === 'driver' && order.driver === currentUser.displayName;

  const handleDeliveryStatus = async (
    deliveryStatus: 'out_for_delivery' | 'delivered',
  ) => {
    const updated = await orderService.setDeliveryStatus(order.id, deliveryStatus);
    if (updated) dispatch({ type: 'UPDATE_ORDER', payload: updated });
  };

  const handlePayment = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return Alert.alert('Invalid', 'Please enter a valid amount.');
    setSaving(true);
    try {
      const updated = await orderService.addPayment(order.id, payType, amt, payNote.trim() || undefined);
      if (updated) dispatch({ type: 'UPDATE_ORDER', payload: updated });
      setShowPayForm(false);
      setPayAmount('');
      setPayNote('');
      Alert.alert('Saved', 'Payment has been recorded.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete ${order.orderNo}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await orderService.delete(order.id);
              dispatch({ type: 'DELETE_ORDER', payload: order.id });
              navigation.goBack();
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        title={order.orderNo}
        onBack={() => navigation.goBack()}
        rightSlot={isAdmin ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('EditOrder', { orderId: order.id })}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Summary calc card */}
        <View style={styles.calcCard}>
          <View style={styles.calcHalf}>
            <Text style={styles.calcLabel}>Outstanding</Text>
            <Text style={[styles.calcValue, { color: isPaid ? colors.success : colors.warning }]}>
              {formatAmountShort(balance)}
            </Text>
          </View>
          {isAdmin && (
            <>
              <View style={styles.calcDivider} />
              <View style={styles.calcHalf}>
                <Text style={styles.calcLabel}>Profit</Text>
                <Text style={[styles.calcValue, { color: profit >= 0 ? colors.success : colors.danger }]}>
                  {formatAmountShort(profit)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Order details */}
        <Card padded={false} style={styles.detailCard}>
          <DetailRow label="Order No." value={order.orderNo} />
          <DetailRow label="Date" value={formatDateDisplay(order.date)} />
          <DetailRow label="Delivery Date" value={formatDateDisplay(order.deliveryDate) || '—'} />
          <DetailRow label="Salesperson" value={order.salesperson} valueColor={colors.primary} />
          <DetailRow label="Driver" value={order.driver || '—'} />
          <DetailRow label="Amount" value={formatAmountShort(order.amount)} />
          <DetailRow label="Deposit" value={formatAmountShort(order.deposit)} />
          <DetailRow label="Add. Deposit" value={formatAmountShort(order.additionalDeposit)} />
          <DetailRow
            label="Balance"
            value={formatAmountShort(balance)}
            valueColor={isPaid ? colors.success : colors.warning}
          />
          {isAdmin && <DetailRow label="Costing" value={formatAmountShort(order.costing)} />}
          {isAdmin && (
            <DetailRow
              label="Profit"
              value={formatAmountShort(profit)}
              valueColor={profit >= 0 ? colors.success : colors.danger}
            />
          )}
          {order.notes ? <DetailRow label="Notes" value={order.notes} /> : null}
        </Card>

        {/* Payment history */}
        {order.paymentHistory.length > 0 && (
          <Card padded={false} style={styles.historyCard}>
            <Text style={styles.historyTitle}>Payment History</Text>
            {order.paymentHistory.map((p, i) => (
              <View
                key={p.id}
                style={[styles.historyRow, i === order.paymentHistory.length - 1 && styles.historyRowLast]}
              >
                <View style={styles.historyDot} />
                <View style={styles.historyBody}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyType}>
                      {p.type === 'deposit' ? 'Deposit' : 'Additional Deposit'}
                    </Text>
                    <Text style={styles.historyAmount}>+{formatAmountShort(p.amount)}</Text>
                  </View>
                  <Text style={styles.historyDate}>{formatTs(p.recordedAt)}</Text>
                  {p.note ? <Text style={styles.historyNote}>{p.note}</Text> : null}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Add payment */}
        {isAdmin && !isPaid && !showPayForm && (
          <PrimaryButton label="+ Add Payment" onPress={() => setShowPayForm(true)} />
        )}

        {isAssignedDriver && order.deliveryStatus === 'pending' && (
          <PrimaryButton
            label="Start Delivery"
            onPress={() => handleDeliveryStatus('out_for_delivery')}
          />
        )}

        {isAssignedDriver && order.deliveryStatus === 'out_for_delivery' && (
          <PrimaryButton
            label="Mark Delivered"
            onPress={() => handleDeliveryStatus('delivered')}
          />
        )}

        {isPaid && (
          <View style={styles.paidBanner}>
            <Text style={styles.paidText}>✓ Fully Paid</Text>
          </View>
        )}

        {showPayForm && (
          <Card style={styles.payCard}>
            <Text style={styles.payTitle}>Add Payment</Text>

            <View style={styles.payTypeRow}>
              {(['deposit', 'additionalDeposit'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.payTypeChip, payType === t && styles.payTypeChipActive]}
                  onPress={() => setPayType(t)}
                >
                  <Text style={[styles.payTypeText, payType === t && styles.payTypeTextActive]}>
                    {t === 'deposit' ? 'Deposit' : 'Additional Deposit'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.payInput}
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder="Amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />

            <TextInput
              style={[styles.payInput, styles.payInputNote]}
              value={payNote}
              onChangeText={setPayNote}
              placeholder="Note (optional)"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.payButtons}>
              <PrimaryButton
                label="Cancel"
                onPress={() => { setShowPayForm(false); setPayAmount(''); setPayNote(''); }}
                variant="ghost"
                style={styles.payBtn}
              />
              <PrimaryButton
                label="Confirm"
                onPress={handlePayment}
                loading={saving}
                style={styles.payBtn}
              />
            </View>
          </Card>
        )}

        {/* Delete */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Delete Order'}</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: fontSize.base, color: colors.textMuted },
  editBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  editBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },

  // Calc card
  calcCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  calcHalf: { flex: 1, alignItems: 'center', padding: spacing.md },
  calcDivider: { width: 1, backgroundColor: colors.primaryLight },
  calcLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calcValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },

  // Detail card
  detailCard: { marginBottom: spacing.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  detailValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },

  // Payment history
  historyCard: { marginBottom: spacing.md },
  historyTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyRowLast: { borderBottomWidth: 0 },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  historyBody: { flex: 1 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyType: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  historyAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.success },
  historyDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  historyNote: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },

  // Paid banner
  paidBanner: {
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: spacing.md,
  },
  paidText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.success },

  // Pay form
  payCard: { marginBottom: spacing.md },
  payTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  payTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  payTypeChip: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  payTypeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  payTypeText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  payTypeTextActive: { color: colors.textInverse },
  payInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  payInputNote: { fontSize: fontSize.md },
  payButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  payBtn: { flex: 1 },

  // Delete
  deleteBtn: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.danger },
});
