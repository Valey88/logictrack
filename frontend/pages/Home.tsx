import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Truck, Mail, Shield, Zap } from "lucide-react";
import { useSearchOrder } from "../services/hooks";
import { useAuth } from "../contexts/AuthContext";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orderCode, setOrderCode] = useState("");
  const searchOrder = useSearchOrder();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) return;

    try {
      const order = await searchOrder.mutateAsync(orderCode);
      if (order) {
        // If authenticated, go to tracking page
        if (isAuthenticated) {
          navigate(`/track/${order.id}`);
        } else {
          // If not authenticated, redirect to login with order code
          navigate(`/login?orderCode=${orderCode}`);
        }
      }
    } catch (error) {
      // Order not found - show error
      console.error("Order not found:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                LogiTrack
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Панель управления
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Регистрация
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6">
            Отслеживайте свой груз
            <span className="block text-blue-600">В реальном времени</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Введите код отслеживания, чтобы увидеть текущий статус и
            местоположение вашего груза. Получайте мгновенные обновления на вашу
            электронную почту.
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex items-center">
              <div className="pl-6 pr-4 text-slate-400">
                <Search size={28} />
              </div>
              <input
                type="text"
                placeholder="Введите код отслеживания (например, 12345)"
                className="flex-1 py-4 text-lg outline-none text-slate-900 placeholder:text-slate-400"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                disabled={searchOrder.isPending}
              />
              <button
                type="submit"
                disabled={searchOrder.isPending || !orderCode.trim()}
                className="mx-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searchOrder.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Поиск...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Отследить
                  </>
                )}
              </button>
            </div>
          </form>

          {searchOrder.isError && (
            <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-fade-in">
              <Package size={20} />
              <p className="font-medium">
                Заказ не найден. Пожалуйста, проверьте код отслеживания.
              </p>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            Нет кода отслеживания?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Войдите в свой аккаунт
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Отслеживание в реальном времени
            </h3>
            <p className="text-slate-600">
              Получайте обновления о местоположении и статусе вашего груза в
              режиме реального времени.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Mail className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Уведомления по email
            </h3>
            <p className="text-slate-600">
              Получайте коды отслеживания и обновления прямо на вашу электронную
              почту.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Безопасно и надежно
            </h3>
            <p className="text-slate-600">
              Ваши данные о грузе защищены корпоративным уровнем безопасности.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            © 2024 LogiTrack TMS. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};
