/**
 * components/DatePickerField.tsx
 * Tappable date field — opens native picker on tap, no keyboard.
 * iOS: bottom-sheet modal with spinner + Done button.
 * Android: native dialog.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { toISO } from '../utils/date';

interface DatePickerFieldProps {
  label: string;
  value: string;       // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
  error?: boolean;
}

function isoToDate(iso: string): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isoToReadable(iso: string): string {
  if (!iso) return 'Select date';
  try {
    const d = isoToDate(iso);
    return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function DatePickerField({ label, value, onChange, required, error }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(isoToDate(value));

  const pickerDate = value ? isoToDate(value) : new Date();

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (selected) onChange(toISO(selected));
    } else {
      if (selected) setTempDate(selected);
    }
  };

  const handleDone = () => {
    onChange(toISO(tempDate));
    setOpen(false);
  };

  const handleOpen = () => {
    setTempDate(pickerDate);
    setOpen(true);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
        {required && <Text style={styles.asterisk}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.field, error && styles.fieldError]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {value ? isoToReadable(value) : 'Select date'}
        </Text>
        <Text style={styles.calIcon}>📅</Text>
      </TouchableOpacity>

      {/* Android: render outside modal, iOS: use modal for bottom sheet */}
      {Platform.OS === 'android' && open && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide">
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlayBg} onPress={() => setOpen(false)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <Text style={styles.sheetCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>{label}</Text>
                <TouchableOpacity onPress={handleDone}>
                  <Text style={styles.sheetDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                style={styles.picker}
                textColor={colors.textPrimary}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
    marginTop: spacing.sm,
  },
  labelError: { color: colors.danger },
  asterisk: { color: colors.danger },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 46,
  },
  fieldError: { borderColor: colors.danger },
  fieldText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  fieldPlaceholder: { color: colors.textMuted, fontWeight: fontWeight.regular },
  calIcon: { fontSize: 16 },

  // iOS sheet
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sheetCancel: { fontSize: fontSize.md, color: colors.textSecondary },
  sheetDone: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  picker: { width: '100%' },
});
