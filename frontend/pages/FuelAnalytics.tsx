import React from "react";
import { useFuelAnalytics } from "../services/hooks";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const FuelAnalytics: React.FC = () => {
  const { data: analysisData = [], isLoading } = useFuelAnalytics();

  if (isLoading) return <div>Расчет топливной аналитики...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Контроль расхода топлива
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">План vs Факт (литры)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="plate_number" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expectedFuel" fill="#94a3b8" name="Норма" />
                <Bar dataKey="totalFuelUsed" fill="#3b82f6" name="Факт" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold mb-4">Отчет по перерасходу</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">ТС</th>
                  <th className="px-4 py-3">Пробег</th>
                  <th className="px-4 py-3">Разница</th>
                  <th className="px-4 py-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysisData.map((item) => (
                  <tr
                    key={item.vehicle_id || item.vehicleId}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.plate_number || item.plateNumber}
                    </td>
                    <td className="px-4 py-3">{item.totalDistance || 0} км</td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        (item.difference || item.overconsumption) > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {(item.difference || item.overconsumption) > 0 ? "+" : ""}
                      {(item.difference || item.overconsumption || 0).toFixed(
                        1
                      )}{" "}
                      л
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "NORMAL" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          <CheckCircle size={12} /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          <AlertCircle size={12} /> {item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
