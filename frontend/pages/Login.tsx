import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Truck, Mail, Lock, AlertCircle } from "lucide-react";
import { useLogin } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";
import { getRedirectPath } from "../utils/navigation";
import { apiClient } from "../services/api";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const orderCode = searchParams.get("orderCode");

  // Перенаправление при изменении статуса аутентификации (fallback)
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user.role, orderCode);
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate, orderCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await loginMutation.mutateAsync({ email, password });
      // Ждем немного, чтобы данные пользователя обновились в контексте
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Пытаемся получить данные пользователя
      let userData = user;
      if (!userData) {
        try {
          userData = await apiClient.getMe();
        } catch (err) {
          console.error("Failed to get user data:", err);
          // Если не удалось получить данные, все равно пытаемся перенаправить
          // на основе данных из контекста или по умолчанию
        }
      }

      if (userData) {
        const redirectPath = getRedirectPath(userData.role, orderCode);
        navigate(redirectPath);
      } else {
        // Если данных нет, перенаправляем на dashboard по умолчанию
        navigate(orderCode ? `/track/${orderCode}` : "/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Неверный email или пароль");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-2xl mb-4">
            <Truck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Добро пожаловать
          </h1>
          <p className="text-slate-600">
            Войдите, чтобы отслеживать свои грузы
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Адрес электронной почты
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ваш@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Нет аккаунта?{" "}
              <button
                onClick={() =>
                  navigate(
                    "/register" + (orderCode ? `?orderCode=${orderCode}` : "")
                  )
                }
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>
        </div>

        {orderCode && (
          <div className="mt-4 text-center text-sm text-slate-500">
            После входа вы будете перенаправлены на отслеживание заказа:{" "}
            <span className="font-mono font-bold">{orderCode}</span>
          </div>
        )}
      </div>
    </div>
  );
};
