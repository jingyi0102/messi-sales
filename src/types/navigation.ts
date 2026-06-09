/**
 * types/navigation.ts
 * React Navigation route param types.
 * Every screen's params must be declared here — never use untyped navigation.
 */

// ── Stack Param Lists ─────────────────────────────────────────────────

export type OrdersStackParamList = {
  OrdersList: { resetFilters?: boolean } | undefined;
  OrderDetail: { orderId: string };
  EditOrder: { orderId: string };
};

export type RootTabParamList = {
  Dashboard: undefined;
  OrdersStack: NavigatorScreenParams<OrdersStackParamList> | undefined;
  CreateOrder: undefined;
  Admin: undefined;
  Delivery: undefined;
  Completed: undefined;
  Account: undefined;
};

// ── Screen Navigation Props ───────────────────────────────────────────
// Import these in each screen file to get fully typed navigation + route.

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';

// Orders stack screens
export type OrdersListScreenProps = NativeStackScreenProps<OrdersStackParamList, 'OrdersList'>;
export type OrderDetailScreenProps = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;
export type EditOrderScreenProps = NativeStackScreenProps<OrdersStackParamList, 'EditOrder'>;

// Tab screens
export type DashboardScreenProps = BottomTabScreenProps<RootTabParamList, 'Dashboard'>;
export type CreateOrderScreenProps = BottomTabScreenProps<RootTabParamList, 'CreateOrder'>;
export type AdminScreenProps = BottomTabScreenProps<RootTabParamList, 'Admin'>;
export type DeliveryScreenProps = BottomTabScreenProps<RootTabParamList, 'Delivery'>;
export type CompletedScreenProps = BottomTabScreenProps<RootTabParamList, 'Completed'>;
export type AccountScreenProps = BottomTabScreenProps<RootTabParamList, 'Account'>;
