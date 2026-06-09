/**
 * components/MonthPickerModal.tsx
 * Tappable "Apr" trigger → modal month/year grid selector.
 * No external dependency — pure React Native.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface MonthPickerModalProps {
  selectedKey: string;    // "MM-YYYY"
  onChange: (key: string) => void;
}

function keyToMY(key: string): { month: number; year: number } {
  const [mm, yyyy] = key.split('-').map(Number);
  return { month: mm, year: yyyy };
}

function toKey(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}-${year}`;
}

export function MonthPickerModal({ selectedKey, onChange }: MonthPickerModalProps) {
  const [visible, setVisible] = useState(false);
  const { month: selMonth, year: selYear } = keyToMY(selectedKey);
  const [viewYear, setViewYear] = useState(selYear);

  const open = () => {
    setViewYear(selYear);
    setVisible(true);
  };

  const select = (month: number) => {
    onChange(toKey(month, viewYear));
    setVisible(false);
  };

  const currentYear = new Date().getFullYear();
  const selectedMonthLabel = MONTH_LABELS[selMonth - 1] ?? '';

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={open} activeOpacity={0.75}>
        <Text style={styles.triggerText}>{selectedMonthLabel}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setVisible(false)} />
          <View style={styles.card}>

            {/* Year nav */}
            <View style={styles.yearRow}>
              <TouchableOpacity
                style={styles.yearBtn}
                onPress={() => setViewYear((y) => y - 1)}
              >
                <Text style={styles.yearBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.yearLabel}>{viewYear}</Text>
              <TouchableOpacity
                style={styles.yearBtn}
                onPress={() => setViewYear((y) => Math.min(y + 1, currentYear + 1))}
              >
                <Text style={styles.yearBtnText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Month grid — 4 columns */}
            <View style={styles.grid}>
              {MONTH_LABELS.map((label, i) => {
                const m = i + 1;
                const isSelected = m === selMonth && viewYear === selYear;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.cell, isSelected && styles.cellActive]}
                    onPress={() => select(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cellText, isSelected && styles.cellTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const CELL_WIDTH = '23%';

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 104,
    height: 58,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  triggerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  yearBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearBtnText: { fontSize: fontSize.lg, color: colors.textPrimary, fontWeight: fontWeight.bold },
  yearLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cell: {
    width: CELL_WIDTH,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cellText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  cellTextActive: { color: colors.textInverse },

  closeBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
});
