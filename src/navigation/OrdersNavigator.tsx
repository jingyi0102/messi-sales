/**
 * navigation/OrdersNavigator.tsx
 * Stack navigator for the Orders tab.
 * Manages: OrdersList → OrderDetail → EditOrder
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersScreen } from '../screens/OrdersScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { EditOrderScreen } from '../screens/EditOrderScreen';
import type { OrdersStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export function OrdersNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="OrdersList" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="EditOrder" component={EditOrderScreen} />
    </Stack.Navigator>
  );
}
