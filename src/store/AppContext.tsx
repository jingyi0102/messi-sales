/**
 * store/AppContext.tsx
 * Lightweight global state using React Context + useReducer.
 * EXTENSION POINT: If state grows complex, swap reducer for Zustand or Redux Toolkit
 * without touching screens — just change this file and the hook.
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Order, Salesperson, Driver } from '../types/order';
import { orderService } from '../services/orderService';
import { peopleService } from '../services/peopleService';
import { currentMonthKey } from '../utils/date';

// ── State shape ───────────────────────────────────────────────────────

export interface AppState {
  orders: Order[];
  salespeople: Salesperson[];
  drivers: Driver[];
  selectedMonthKey: string;
  isLoading: boolean;
}

const initialState: AppState = {
  orders: [],
  salespeople: [],
  drivers: [],
  selectedMonthKey: currentMonthKey(),
  isLoading: true,
};

// ── Actions ───────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'DELETE_ORDER'; payload: string }
  | { type: 'SET_SALESPEOPLE'; payload: Salesperson[] }
  | { type: 'SET_DRIVERS'; payload: Driver[] }
  | { type: 'SET_MONTH'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

// ── Reducer ───────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o,
        ),
      };
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload),
      };
    case 'SET_SALESPEOPLE':
      return { ...state, salespeople: action.payload };
    case 'SET_DRIVERS':
      return { ...state, drivers: action.payload };
    case 'SET_MONTH':
      return { ...state, selectedMonthKey: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Bootstrap: load all data from storage on mount
  useEffect(() => {
    async function bootstrap() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [orders, salespeople, drivers] = await Promise.all([
          orderService.getAll(),
          peopleService.getSalespeople(),
          peopleService.getDrivers(),
        ]);
        dispatch({ type: 'SET_ORDERS', payload: orders });
        dispatch({ type: 'SET_SALESPEOPLE', payload: salespeople });
        dispatch({ type: 'SET_DRIVERS', payload: drivers });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    bootstrap();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
