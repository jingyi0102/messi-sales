/**
 * navigation/RootNavigator.tsx
 * Bottom tab navigator — the app's top-level routing structure.
 *
 * Tab layout:
 *   Home (Dashboard) | Orders (Stack) | + (CreateOrder) | Delivery | Admin
 *
 * EXTENSION POINT: add an Auth stack wrapper around this navigator
 * when login is needed — just wrap RootNavigator in a conditional in App.tsx.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CreateOrderScreen } from '../screens/CreateOrderScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { DeliveryScreen } from '../screens/DeliveryScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { CompletedScreen } from '../screens/CompletedScreen';
import { OrdersNavigator } from './OrdersNavigator';
import { useAuth } from '../store';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';
import type { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

// ── Tab icon components ───────────────────────────────────────────────

function TabIcon({
  label,
  focused,
  isPlus,
}: {
  label: string;
  focused: boolean;
  isPlus?: boolean;
}) {
  if (isPlus) {
    return (
      <View style={iconStyles.plusBtn}>
        <Text style={iconStyles.plusText}>+</Text>
      </View>
    );
  }
  const iconMap: Record<string, string> = {
    Home: '⊞',
    Orders: '☰',
    Delivery: '🚚',
    Admin: '👤',
    Completed: '✓',
    Account: '●',
  };
  return (
    <Text style={[iconStyles.icon, focused && iconStyles.iconFocused]}>
      {iconMap[label] ?? '●'}
    </Text>
  );
}

const iconStyles = StyleSheet.create({
  icon: {
    fontSize: 20,
    color: colors.tabInactive,
  },
  iconFocused: {
    color: colors.tabActive,
  },
  plusBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  plusText: {
    fontSize: 26,
    color: colors.textInverse,
    fontWeight: fontWeight.bold,
    lineHeight: 30,
  },
});

// ── Navigator ─────────────────────────────────────────────────────────

export function RootNavigator() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      {role !== 'driver' && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: role === 'salesman' ? 'My Sales' : 'Home',
            tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
          }}
        />
      )}

      <Tab.Screen
        name="OrdersStack"
        component={OrdersNavigator}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon label="Orders" focused={focused} />,
        }}
      />

      {role !== 'driver' && (
        <Tab.Screen
          name="CreateOrder"
          component={CreateOrderScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => <TabIcon label="Create" focused={focused} isPlus />,
          }}
        />
      )}

      <Tab.Screen
        name="Delivery"
        component={DeliveryScreen}
        options={{
          tabBarLabel: 'Delivery',
          tabBarIcon: ({ focused }) => <TabIcon label="Delivery" focused={focused} />,
        }}
      />

      {role === 'driver' && (
        <Tab.Screen
          name="Completed"
          component={CompletedScreen}
          options={{
            tabBarLabel: 'Completed',
            tabBarIcon: ({ focused }) => <TabIcon label="Completed" focused={focused} />,
          }}
        />
      )}

      {role === 'admin' ? (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ focused }) => <TabIcon label="Admin" focused={focused} />,
          }}
        />
      ) : (
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarLabel: 'Account',
            tabBarIcon: ({ focused }) => <TabIcon label="Account" focused={focused} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBackground,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    height: 68,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
