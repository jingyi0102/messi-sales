export type UserRole = 'admin' | 'salesman' | 'driver';

export interface Account {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface CreateAccountInput {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}
