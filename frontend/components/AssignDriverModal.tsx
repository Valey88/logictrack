import React, { useState } from "react";
import { useDrivers, useUpdateVehicle } from "../services/hooks";
import { X, User, Check, AlertCircle } from "lucide-react";

interface AssignDriverModalProps {
  vehicleId: number;
  currentDriverId?: number;
  onClose: () => void;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  vehicleId,
  currentDriverId,
  onClose,
}) => {
  const { data: drivers = [], isLoading } = useDrivers();
  const updateVehicleMutation = useUpdateVehicle();
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(
    currentDriverId || null
  );

  const handleSave = async () => {
    try {
      await updateVehicleMutation.mutateAsync({
        id: vehicleId,
        data: { driverId: selectedDriverId }, // null снимет водителя
      });
      onClose();
    } catch (error) {
      console.error("Failed to assign driver", error);
      alert("Ошибка при назначении водителя");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">
            Назначение водителя
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="text-center py-4">Загрузка водителей...</div>
          ) : (
            <>
              {/* Option: No Driver */}
              <button
                onClick={() => setSelectedDriverId(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedDriverId === null
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <X size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold">Без водителя</div>
                  <div className="text-xs opacity-70">
                    Снять текущего водителя
                  </div>
                </div>
                {selectedDriverId === null && <Check size={20} />}
              </button>

              {/* Drivers List */}
              {drivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriverId(driver.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    selectedDriverId === driver.id
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                    {driver.user?.fullName?.charAt(0) || "D"}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold">
                      {driver.user?.fullName || `Водитель #${driver.id}`}
                    </div>
                    <div className="text-xs opacity-70 flex gap-2">
                      <span>Лицензия: {driver.licenseNumber}</span>
                      <span>★ {driver.rating}</span>
                    </div>
                  </div>
                  {selectedDriverId === driver.id && <Check size={20} />}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={handleSave}
            disabled={updateVehicleMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
          >
            {updateVehicleMutation.isPending ? "Сохранение..." : "Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  );
};
