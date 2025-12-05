import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Fuel,
  Settings,
  CheckCircle,
  Activity,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// Импортируем хуки API
import {
  useVehicle,
  useMaintenanceRecords,
  useFuelLogs,
} from "../services/hooks";
import { VehicleStatus } from "../types";
import { translateVehicleStatus } from "../utils/translations";
// Импортируем наше новое модальное окно
import { AssignDriverModal } from "../components/AssignDriverModal";

export const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // Используем реальные данные из API вместо моков
  const { data: vehicle, isLoading } = useVehicle(id || "");
  const { data: maintenance = [] } = useMaintenanceRecords(id);
  const { data: fuelLogs = [] } = useFuelLogs(id);

  if (isLoading)
    return <div className="p-8 text-center">Загрузка данных транспорта...</div>;

  if (!vehicle) {
    return <div className="p-8 text-center">Транспорт не найден</div>;
  }

  // Подготовка данных для графика
  const chartData = fuelLogs
    .slice(0, 10)
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      consumption: log.liters,
    }))
    .reverse();

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ACTIVE:
        return "bg-green-100 text-green-700";
      case VehicleStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-700";
      case VehicleStatus.MAINTENANCE:
        return "bg-orange-100 text-orange-700";
      case VehicleStatus.SOS:
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {vehicle.plateNumber}
            <span
              className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusColor(
                vehicle.status
              )}`}
            >
              {translateVehicleStatus(vehicle.status)}
            </span>
          </h1>
          <p className="text-slate-500 text-sm">
            {vehicle.make} {vehicle.model} • {vehicle.vin}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Driver */}
        <div className="space-y-6">
          {/* Key Specs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="text-blue-500" /> Характеристики
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 text-sm">Норма расхода</span>
                <span className="font-medium">
                  {vehicle.normConsumption} л/100км
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 text-sm">Топливо</span>
                <span className="font-medium">
                  {vehicle.fuelLevel?.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 text-sm">Пробег</span>
                <span className="font-medium">
                  {vehicle.mileage?.toLocaleString()} км
                </span>
              </div>
              {vehicle.currentLocation && (
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Координаты</span>
                  <span className="font-medium text-right text-xs font-mono">
                    {vehicle.currentLocation.lat.toFixed(4)},{" "}
                    {vehicle.currentLocation.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Driver Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="text-blue-500" /> Водитель
            </h3>
            {vehicle.driver ? (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-lg">
                  {vehicle.driver.user?.fullName?.charAt(0) || "D"}
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {vehicle.driver.user?.fullName ||
                      `ID: ${vehicle.driver.id}`}
                  </div>
                  <div className="text-sm text-slate-500">
                    {vehicle.driver.user?.phone || "Нет телефона"}
                  </div>
                  <div className="text-xs text-yellow-600 font-bold mt-1">
                    ★ {vehicle.driver.rating} Рейтинг
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Водитель не назначен
              </div>
            )}

            <button
              onClick={() => setIsDriverModalOpen(true)}
              className="w-full mt-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-medium transition-all shadow-sm"
            >
              {vehicle.driver ? "Сменить водителя" : "Назначить водителя"}
            </button>
          </div>
        </div>

        {/* Middle/Right: Charts & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fuel Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Fuel className="text-blue-500" /> История заправок
            </h3>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="consumption"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Нет данных о заправках
                </div>
              )}
            </div>
          </div>

          {/* Maintenance List */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="text-slate-400" /> История обслуживания
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Тип</th>
                    <th className="px-4 py-3">Стоимость</th>
                    <th className="px-4 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenance.length > 0 ? (
                    maintenance.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(m.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {m.type}
                        </td>
                        <td className="px-4 py-3">
                          ₽{m.cost.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {m.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} /> Выполнено
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              <Calendar size={10} /> План
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-slate-400"
                      >
                        История ТО пуста
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Selection Modal */}
      {isDriverModalOpen && (
        <AssignDriverModal
          vehicleId={vehicle.id}
          currentDriverId={vehicle.driverId}
          onClose={() => setIsDriverModalOpen(false)}
        />
      )}
    </div>
  );
};
