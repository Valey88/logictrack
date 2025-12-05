import React, { useState } from "react";
import {
  Phone,
  Star,
  User,
  Plus,
  X,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useDrivers, useCreateDriverWithUser } from "../services/hooks";

export const Drivers: React.FC = () => {
  const { data: drivers = [], isLoading } = useDrivers();
  const createDriverMutation = useCreateDriverWithUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    license_number: "",
  });
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    try {
      await createDriverMutation.mutateAsync({
        email: form.email,
        password: form.password,
        full_name: form.full_name || undefined,
        phone: form.phone || undefined,
        license_number: form.license_number || undefined,
      });
      setIsModalOpen(false);
      setForm({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        license_number: "",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Ошибка создания водителя. Пожалуйста, попробуйте снова."
      );
    }
  };

  // Логирование для отладки (должно быть до условного возврата)
  React.useEffect(() => {
    if (drivers.length > 0) {
      console.log("Drivers data (camelCase after conversion):", drivers);
      drivers.forEach((driver, index) => {
        console.log(`Driver ${index}:`, {
          id: driver.id,
          userId: driver.userId || driver.user_id,
          licenseNumber: driver.licenseNumber || driver.license_number,
          user: driver.user,
        });
      });
    }
  }, [drivers]);

  if (isLoading) return <div>Загрузка водителей...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Водительский состав</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center"
        >
          <Plus size={20} /> Добавить водителя
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className="bg-white p-6 rounded-xl border shadow-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-600">
                {driver.user?.fullName?.charAt(0) || "D"}
              </div>
              <div>
                <div className="font-bold">
                  {driver.user?.fullName || "Водитель #" + driver.id}
                </div>
                <div className="text-sm text-yellow-500 flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {driver.rating}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={14} /> {driver.user?.phone || "Нет телефона"}
              </div>
              <div className="text-xs bg-slate-100 p-2 rounded">
                Лицензия: {driver.license_number || "Не указана"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Добавить водителя</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                  setForm({
                    email: "",
                    password: "",
                    full_name: "",
                    phone: "",
                    license_number: "",
                  });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 border border-red-100">
                <AlertCircle size={16} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Адрес электронной почты *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="driver@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Пароль *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Минимум 6 символов"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Полное имя
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Иван Иванов"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Телефон
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+7 900 123 45 67"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Номер водительского удостоверения
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234567890"
                  value={form.license_number}
                  onChange={(e) =>
                    setForm({ ...form, license_number: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError("");
                    setForm({
                      email: "",
                      password: "",
                      full_name: "",
                      phone: "",
                      license_number: "",
                    });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createDriverMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createDriverMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Создание...
                    </>
                  ) : (
                    "Создать водителя"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
