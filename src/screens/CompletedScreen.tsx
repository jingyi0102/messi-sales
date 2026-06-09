import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, Card, EmptyState } from '../components';
import { useAppStore, useAuth } from '../store';
import { colors, fontSize, fontWeight, spacing } from '../theme';
import { formatDateDisplay } from '../utils/date';
import type { CompletedScreenProps } from '../types/navigation';

export function CompletedScreen({ navigation }: CompletedScreenProps) {
  const { state } = useAppStore();
  const { currentUser } = useAuth();
  const orders = useMemo(
    () =>
      state.orders
        .filter(
          (order) =>
            order.deliveryStatus === 'delivered' &&
            (currentUser?.role !== 'driver' || order.driver === currentUser.displayName),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [currentUser, state.orders],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Completed" />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate('OrdersStack', {
                screen: 'OrderDetail',
                params: { orderId: item.id },
              })
            }
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderNo}>{item.orderNo}</Text>
                <Text style={styles.done}>Delivered</Text>
              </View>
              <Text style={styles.meta}>
                {formatDateDisplay(item.deliveryDate)} · {item.driver || 'No driver'}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="✓"
            title="No completed deliveries"
            subtitle="Delivered orders will appear here"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  done: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.success },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
});
