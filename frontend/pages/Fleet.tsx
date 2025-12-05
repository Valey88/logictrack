import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Fuel,
  Truck,
  AlertTriangle,
  CheckCircle,
  Settings,
  X,
} from "lucide-react";
import { useVehicles, useCreateVehicle } from "../services/hooks";
import { VehicleStatus, Vehicle } from "../types";
import { translateVehicleStatus } from "../utils/translations";

export const Fleet: React.FC = () => {
  const navigate = useNavigate();
  const { data: vehicles = [], isLoading } = useVehicles();
  const createVehicleMutation = useCreateVehicle();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newVehicleForm, setNewVehicleForm] = useState({
    plateNumber: "",
    vin: "",
    make: "",
    model: "",
    normConsumption: "12.0",
  });

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

  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (vehicle.plate_number?.toLowerCase() || "").includes(searchLower) ||
      (vehicle.make?.toLowerCase() || "").includes(searchLower) ||
      (vehicle.model?.toLowerCase() || "").includes(searchLower);
    const matchesStatus =
      statusFilter === "ALL" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVehicleMutation.mutateAsync({
        plate_number: newVehicleForm.plateNumber,
        vin: newVehicleForm.vin,
        make: newVehicleForm.make,
        model: newVehicleForm.model,
        norm_consumption: parseFloat(newVehicleForm.normConsumption),
        status: VehicleStatus.IDLE,
      });
      setIsAddModalOpen(false);
      setNewVehicleForm({
        plateNumber: "",
        vin: "",
        make: "",
        model: "",
        normConsumption: "12.0",
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        "Ошибка при создании транспорта. Проверьте, что VIN и гос. номер уникальны.";
      alert(errorMessage);
      console.error("Vehicle creation error:", error);
    }
  };

  if (isLoading) return <div>Загрузка списка транспорта...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Управление парком
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {vehicles.length} единиц техники в базе данных.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          Добавить транспорт
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="text-slate-400" size={16} />
          <select
            className="w-full sm:w-48 border border-slate-300 rounded-lg px-2 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Все статусы</option>
            {Object.values(VehicleStatus).map((status) => (
              <option key={status} value={status}>
                {translateVehicleStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Данные транспорта</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">Водитель</th>
                <th className="px-6 py-4">Топливо</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  onClick={() => navigate(`/fleet/${vehicle.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Truck size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {vehicle.plate_number}
                        </div>
                        <div className="text-xs text-slate-500">
                          {vehicle.make} {vehicle.model}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        vehicle.status
                      )}`}
                    >
                      {translateVehicleStatus(vehicle.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {vehicle.driver ? (
                      vehicle.driver.user?.full_name ||
                      "Водитель ID " + vehicle.driver.id
                    ) : (
                      <span className="text-slate-400 italic">Нет</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Fuel size={14} className="text-slate-400" />
                      <span>
                        {vehicle.fuel_level !== null &&
                        vehicle.fuel_level !== undefined
                          ? `${vehicle.fuel_level.toFixed(0)}%`
                          : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <MoreHorizontal size={20} className="text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal code remains mostly same, just hooking up API calls */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">Добавить транспорт</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input
                className="w-full border p-2 rounded"
                placeholder="Марка"
                value={newVehicleForm.make}
                onChange={(e) =>
                  setNewVehicleForm({ ...newVehicleForm, make: e.target.value })
                }
                required
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Модель"
                value={newVehicleForm.model}
                onChange={(e) =>
                  setNewVehicleForm({
                    ...newVehicleForm,
                    model: e.target.value,
                  })
                }
                required
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Гос. номер"
                value={newVehicleForm.plateNumber}
                onChange={(e) =>
                  setNewVehicleForm({
                    ...newVehicleForm,
                    plateNumber: e.target.value,
                  })
                }
                required
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="VIN"
                value={newVehicleForm.vin}
                onChange={(e) =>
                  setNewVehicleForm({ ...newVehicleForm, vin: e.target.value })
                }
                required
              />
              <input
                className="w-full border p-2 rounded"
                type="number"
                placeholder="Норма расхода"
                value={newVehicleForm.normConsumption}
                onChange={(e) =>
                  setNewVehicleForm({
                    ...newVehicleForm,
                    normConsumption: e.target.value,
                  })
                }
                required
              />
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createVehicleMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {createVehicleMutation.isPending
                    ? "Сохранение..."
                    : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
