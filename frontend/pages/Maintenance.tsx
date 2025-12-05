import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Wrench,
  Clock,
  CheckCircle,
  Plus,
} from "lucide-react";
import {
  useMaintenanceRecords,
  useCreateMaintenance,
  useVehicles,
} from "../services/hooks";
import { MaintenanceStatus } from "../types";

export const Maintenance: React.FC = () => {
  const { data: records = [], isLoading } = useMaintenanceRecords();
  const { data: vehicles = [] } = useVehicles();
  const createMutation = useCreateMaintenance();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    vehicleId: "",
    type: "",
    cost: "",
    date: "",
  });

  const upcoming = records.filter(
    (r) => r.status === MaintenanceStatus.SCHEDULED
  );
  const history = records.filter(
    (r) => r.status === MaintenanceStatus.COMPLETED
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      vehicle_id: parseInt(newRecord.vehicleId),
      type: newRecord.type,
      cost: parseFloat(newRecord.cost),
      scheduled_date: new Date(newRecord.date).toISOString(),
      status: MaintenanceStatus.SCHEDULED,
    });
    setIsModalOpen(false);
  };

  if (isLoading) return <div>Загрузка ТО...</div>;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ТО и Ремонты</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Планировать
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-600">
            <Clock size={20} /> Предстоящие
          </h3>
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <p className="text-slate-400">Нет запланированных работ</p>
            )}
            {upcoming.map((rec) => (
              <div
                key={rec.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold">{rec.vehicle?.plate_number}</div>
                  <div className="text-sm text-slate-500">{rec.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {new Date(rec.scheduled_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-500">₽{rec.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-green-600">
            <CheckCircle size={20} /> История
          </h3>
          <div className="space-y-3">
            {history.map((rec) => (
              <div
                key={rec.id}
                className="p-3 bg-slate-50 rounded-lg flex justify-between items-center opacity-75"
              >
                <div>
                  <div className="font-bold">{rec.vehicle?.plate_number}</div>
                  <div className="text-sm text-slate-500">{rec.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {new Date(rec.scheduled_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-green-600 font-bold">
                    Выполнено
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Планирование ТО</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <select
                className="w-full border p-2 rounded"
                value={newRecord.vehicleId}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, vehicleId: e.target.value })
                }
                required
              >
                <option value="">Выберите транспорт</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} ({v.make})
                  </option>
                ))}
              </select>
              <input
                className="w-full border p-2 rounded"
                placeholder="Вид работ (Замена масла)"
                value={newRecord.type}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, type: e.target.value })
                }
                required
              />
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Стоимость (RUB)"
                value={newRecord.cost}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, cost: e.target.value })
                }
                required
              />
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={newRecord.date}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, date: e.target.value })
                }
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
