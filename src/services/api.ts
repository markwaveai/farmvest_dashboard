import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { User, CreateUserRequest, ApiResponse } from '../types';

const api = axios.create({
  timeout: 10000,
});

export const userService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get<{status: string, statuscode: number, users: User[]}>(API_ENDPOINTS.getUsers());
      return response.data.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getReferrals: async (): Promise<User[]> => {
    try {
      const response = await api.get<{status: string, statuscode: number, users: User[]}>(API_ENDPOINTS.getReferrals());
      return response.data.users;
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  },

  getUserDetails: async (mobile: string): Promise<User> => {
    try {
      const response = await api.get<User>(API_ENDPOINTS.getUserDetails(mobile));
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  createUser: async (userData: CreateUserRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(API_ENDPOINTS.createUser(), userData);
      return { data: response.data, message: 'User created successfully' };
    } catch (error) {
      console.error('Error creating user:', error);
      return { error: 'Failed to create user' };
    }
  },

  verifyUser: async (mobile: string): Promise<void> => {
    try {
      const response = await api.post(API_ENDPOINTS.verifyUser(), { mobile, device_id: 'web', device_model: 'browser' });
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Failed to verify user');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  },

  updateUser: async (mobile: string, updates: Partial<User>): Promise<void> => {
    try {
      const response = await api.put(API_ENDPOINTS.updateUser(mobile), updates);
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      await api.get(API_ENDPOINTS.health());
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};
