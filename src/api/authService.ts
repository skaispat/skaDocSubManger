import { supabase } from '../lib/supabase';
import { User } from '../store/authStore';

export const authService = {
  async login(username: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.username,
      fullName: data.full_name,
      role: data.role as 'admin' | 'user',
      permissions: data.permissions || [],
    };
  },

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      return [];
    }

    return data.map(u => ({
      id: u.username,
      fullName: u.full_name,
      role: u.role,
      permissions: u.permissions || [],
    }));
  },

  async addUser(user: User & { password?: string }): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .insert([
        {
          username: user.id,
          password: user.password,
          role: user.role,
          permissions: user.permissions,
        },
      ]);

    if (error) {
      return false;
    }
    return true;
  },

  async updateUser(username: string, updates: Partial<User & { password?: string }>): Promise<boolean> {
    const payload: any = {};
    if (updates.role) payload.role = updates.role;
    if (updates.permissions) payload.permissions = updates.permissions;
    if (updates.password) payload.password = updates.password;

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('username', username);

    if (error) {
      return false;
    }
    return true;
  },

  async deleteUser(username: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', username);

    if (error) {
      return false;
    }
    return true;
  }
};
