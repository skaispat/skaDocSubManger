import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../api/authService';

export interface User {
  id: string; // username
  password?: string;
  role: 'admin' | 'user';
  permissions: string[]; // e.g., ['Dashboard', 'Document', 'Subscription']
}

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
  addUser: (user: User & { password?: string }) => Promise<boolean>;
  updateUser: (id: string, updatedUser: Partial<User & { password?: string }>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      users: [],

      login: async (username: string, password: string) => {
        const user = await authService.login(username, password);
        if (user) {
          set({ isAuthenticated: true, currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false, currentUser: null });
      },

      fetchUsers: async () => {
        const users = await authService.getUsers();
        set({ users });
      },

      addUser: async (newUser: User & { password?: string }) => {
        const success = await authService.addUser(newUser);
        if (success) {
          await get().fetchUsers();
          return true;
        }
        return false;
      },

      updateUser: async (id: string, updatedUser: Partial<User & { password?: string }>) => {
        const success = await authService.updateUser(id, updatedUser);
        if (success) {
          await get().fetchUsers();
          // If updating the currently logged in user, update that too
          const current = get().currentUser;
          if (current?.id === id) {
            set({ currentUser: { ...current, ...updatedUser } });
          }
          return true;
        }
        return false;
      },

      deleteUser: async (id: string) => {
        const success = await authService.deleteUser(id);
        if (success) {
          await get().fetchUsers();
          return true;
        }
        return false;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser
      }),
    }
  )
);

export default useAuthStore;