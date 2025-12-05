import React, { createContext, useContext, ReactNode } from "react";
import { useMe, useLogout } from "../services/auth";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: user, isLoading, error } = useMe();
  const logout = useLogout();

  // Проверяем авторизацию: есть токен И есть данные пользователя (или загрузка еще идет)
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("auth_token");
  const isAuthenticated = hasToken && (!!user || isLoading);

  // Логируем для отладки
  React.useEffect(() => {
    console.log("AuthContext state:", {
      hasToken,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      isLoading,
      error: error ? error.message : null,
      isAuthenticated,
    });
  }, [hasToken, user, isLoading, error, isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{ user: user || null, isLoading, isAuthenticated, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
