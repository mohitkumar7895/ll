import { createContext, useCallback, useEffect, useState } from "react";
import { getCurrentUser, loginAdmin, loginStudent, signupStudent } from "../services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "library_token";
const USER_KEY = "library_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setUser(response.user);
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const studentLogin = useCallback(async (payload) => {
    const response = await loginStudent(payload);
    persistSession(response.token, response.user);
    return response.user;
  }, [persistSession]);

  const adminLogin = useCallback(async (payload) => {
    const response = await loginAdmin(payload);
    persistSession(response.token, response.user);
    return response.user;
  }, [persistSession]);

  const studentSignup = useCallback(async (formData) => {
    const response = await signupStudent(formData);
    persistSession(response.token, response.user);
    return response.user;
  }, [persistSession]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    studentLogin,
    adminLogin,
    studentSignup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
