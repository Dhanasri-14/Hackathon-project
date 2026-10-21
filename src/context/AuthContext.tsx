import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Donor, UserRole } from '../types.ts';
import { apiRequest, setAuthToken, getAuthToken } from '../api.ts';

interface AuthContextType {
  user: User | null;
  donorInfo: Donor | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  donorInfo: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshMe: async () => {},
  switchDemoRole: async () => {},
});

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  admin: { email: 'admin@uyirthunai.org', pass: 'admin123' },
  hospital_staff: { email: 'staff.rajesh@apollo-hospital.org', pass: 'hospital123' },
  donor: { email: 'donor.kavitha@gmail.com', pass: 'donor123' },
  pharmacy_staff: { email: 'pharmacist.anand@medplus-tn.org', pass: 'pharma123' },
  courier: { email: 'courier.murugan@fastmed-logistics.org', pass: 'courier123' },
  patient: { email: 'patient.priya@outlook.com', pass: 'patient123' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [donorInfo, setDonorInfo] = useState<Donor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshMe = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setDonorInfo(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiRequest<{ user: User; donorInfo: Donor | null }>('/auth/me');
      setUser(res.user);
      setDonorInfo(res.donorInfo);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      setAuthToken(null);
      setUser(null);
      setDonorInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(res.token);
      setUser(res.user);
      await refreshMe();
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setAuthToken(res.token);
      setUser(res.user);
      await refreshMe();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setDonorInfo(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    if (cred) {
      await login(cred.email, cred.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        donorInfo,
        loading,
        login,
        register,
        logout,
        refreshMe,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
