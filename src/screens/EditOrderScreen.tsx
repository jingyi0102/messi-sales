/**
 * screens/EditOrderScreen.tsx
 * Edit an existing order — date pickers, required field indicators, inline validation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { AppHeader, PrimaryButton, DatePickerField } from '../components';
import { useAppStore, useAuth } from '../store';
import { orderService } from '../services/orderService';
import { displayToISO } from '../utils/date';
import { computeBalance, computeProfit, roundCurrency } from '../utils/calculation';
import type { EditOrderScreenProps } from '../types/navigation';

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={fStyles.label}>
      {label}
      {required && <Text style={{ color: colors.danger }}> *</Text>}
    </Text>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
  error?: boolean;
}) {
  return (
    <TextInput
      style={[fStyles.input, error && fStyles.inputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      autoCapitalize="characters"
    />
  );
}

function PickerRow({
  options,
  selected,
  onSelect,
  error = false,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  error?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[fStyles.pickerRow, error && fStyles.pickerRowError]}
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[fStyles.chip, opt === selected && fStyles.chipActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[fStyles.chipText, opt === selected && fStyles.chipTextActive]}>
            {opt || '—'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function ErrorHint({ message }: { message: string }) {
  return <Text style={fStyles.errorHint}>{message}</Text>;
}

export function EditOrderScreen({ route, navigation }: EditOrderScreenProps) {
  const { orderId } = route.params;
  const { state, dispatch } = useAppStore();
  const { currentUser } = useAuth();
  const { salespeople, drivers } = state;

  const order =
    currentUser?.role === 'admin'
      ? state.orders.find((o) => o.id === orderId)
      : undefined;

  const [orderNo, setOrderNo] = useState('');
  const [manualSO, setManualSO] = useState('');
  const [date, setDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [amount, setAmount] = useState('');
  const [deposit, setDeposit] = useState('');
  const [additionalDeposit, setAdditionalDeposit] = useState('');
  const [costing, setCosting] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [driver, setDriver] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!order) return;
    setOrderNo(order.orderNo);
    setManualSO(order.manualSO ?? '');
    setDate(displayToISO(order.date));
    setDeliveryDate(order.deliveryDate ? displayToISO(order.deliveryDate) : '');
    setAmount(String(order.amount));
    setDeposit(String(order.deposit));
    setAdditionalDeposit(String(order.additionalDeposit));
    setCosting(String(order.costing));
    setSalesperson(order.salesperson);
    setDriver(order.driver ?? '');
    setNotes(order.notes ?? '');
  }, [order]);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader title="Edit Order" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.notFound}>Order not found or access denied.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const balCalc = roundCurrency(
    computeBalance(Number(amount) || 0, Number(deposit) || 0, Number(additionalDeposit) || 0),
  );
  const profCalc = roundCurrency(computeProfit(Number(amount) || 0, Number(costing) || 0));

  const errors = {
    orderNo: !orderNo.trim(),
    date: !date,
    deliveryDate: !deliveryDate,
    amount: !amount || Number(amount) <= 0,
    salesperson: !salesperson,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSave = async () => {
    setSubmitted(true);
    if (hasErrors) {
      Alert.alert('Missing fields', 'Please fill in all required fields marked with *.');
      return;
    }
    setSaving(true);
    try {
      const updated = await orderService.update(orderId, {
        orderNo: orderNo.trim(),
        manualSO: manualSO.trim(),
        date,
        deliveryDate,
        amount: Number(amount),
        deposit: Number(deposit) || 0,
        additionalDeposit: Number(additionalDeposit) || 0,
        costing: Number(costing) || 0,
        salesperson,
        driver,
        notes: notes.trim(),
        status: order.status,
      });
      if (updated) dispatch({ type: 'UPDATE_ORDER', payload: updated });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const spNames = salespeople.map((p) => p.name);
  const drNames = ['', ...drivers.map((d) => d.name)];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title={`Edit ${order.orderNo}`} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BM + Manual S/O */}
        <View style={styles.row}>
          <View style={styles.half}>
            <FieldLabel label="BM Order No." required />
            <StyledInput
              value={orderNo}
              onChangeText={setOrderNo}
              placeholder="BM 0001"
              error={submitted && errors.orderNo}
            />
            {submitted && errors.orderNo && <ErrorHint message="Required" />}
          </View>
          <View style={styles.half}>
            <FieldLabel label="Manual S/O" />
            <StyledInput value={manualSO} onChangeText={setManualSO} placeholder="Optional" />
          </View>
        </View>

        {/* Dates */}
        <View style={styles.row}>
          <View style={styles.half}>
            <DatePickerField
              label="Date"
              value={date}
              onChange={setDate}
              required
              error={submitted && errors.date}
            />
            {submitted && errors.date && <ErrorHint message="Required" />}
          </View>
          <View style={styles.half}>
            <DatePickerField
              label="Delivery Date"
              value={deliveryDate}
              onChange={setDeliveryDate}
              required
              error={submitted && errors.deliveryDate}
            />
            {submitted && errors.deliveryDate && <ErrorHint message="Required" />}
          </View>
        </View>

        {/* Amount */}
        <FieldLabel label="Amount" required />
        <StyledInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={submitted && errors.amount}
        />
        {submitted && errors.amount && <ErrorHint message="Enter a valid amount" />}

        {/* Deposit row */}
        <View style={styles.row}>
          <View style={styles.half}>
            <FieldLabel label="Deposit" required />
            <StyledInput
              value={deposit}
              onChangeText={setDeposit}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <FieldLabel label="Add. Deposit" />
            <StyledInput
              value={additionalDeposit}
              onChangeText={setAdditionalDeposit}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Costing */}
        <FieldLabel label="Costing" required />
        <StyledInput
          value={costing}
          onChangeText={setCosting}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        {/* Live calc display */}
        <View style={styles.calcCard}>
          <View style={styles.calcHalf}>
            <Text style={styles.calcLabel}>Balance</Text>
            <Text style={[styles.calcValue, { color: balCalc > 0 ? colors.warning : colors.success }]}>
              {balCalc.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.calcDivider} />
          <View style={styles.calcHalf}>
            <Text style={styles.calcLabel}>Profit</Text>
            <Text style={[styles.calcValue, { color: profCalc >= 0 ? colors.success : colors.danger }]}>
              {profCalc.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Salesperson */}
        <FieldLabel label="Salesperson" required />
        <PickerRow
          options={spNames}
          selected={salesperson}
          onSelect={setSalesperson}
          error={submitted && errors.salesperson}
        />
        {submitted && errors.salesperson && <ErrorHint message="Select a salesperson" />}

        {/* Driver */}
        <FieldLabel label="Driver" />
        <PickerRow options={drNames} selected={driver} onSelect={setDriver} />

        {/* Notes */}
        <FieldLabel label="Notes" />
        <StyledInput value={notes} onChangeText={setNotes} placeholder="Optional" />

        <PrimaryButton label="Save Changes" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: fontSize.base, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
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
  saveBtn: { marginTop: spacing.lg },
});

const fStyles = StyleSheet.create({
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  inputError: { borderColor: colors.danger },
  errorHint: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginBottom: spacing.xs,
    marginTop: -2,
  },
  pickerRow: { gap: spacing.xs, marginBottom: spacing.sm, paddingVertical: 2 },
  pickerRowError: { opacity: 1 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
});
