import React from "react";
import { Truck, Package, AlertTriangle, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStats } from "../services/hooks";

const KPICard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
        <Icon size={24} />
      </div>
      {trend && (
        <span
          className={`text-sm font-medium ${
            trendUp ? "text-green-600" : "text-red-600"
          } flex items-center gap-1`}
        >
          {trendUp ? "+" : "-"}
          {trend}
          <TrendingUp size={14} className={trendUp ? "" : "rotate-180"} />
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useDashboardStats();

  // Моковые данные для графика, пока бекенд не вернет историю
  const chartData = [
    {
      name: "Пн",
      revenue: stats?.totalRevenue ? stats.totalRevenue * 0.12 : 40000,
    },
    {
      name: "Вт",
      revenue: stats?.totalRevenue ? stats.totalRevenue * 0.15 : 30000,
    },
    {
      name: "Ср",
      revenue: stats?.totalRevenue ? stats.totalRevenue * 0.1 : 20000,
    },
    {
      name: "Чт",
      revenue: stats?.totalRevenue ? stats.totalRevenue * 0.18 : 27800,
    },
    {
      name: "Пт",
      revenue: stats?.totalRevenue ? stats.totalRevenue * 0.2 : 18900,
    },
    {
      name: "Сб",
      revenue: stats?.totalRevenue ? stats.totalRevenue * 0.15 : 23900,
    },
    {
      name: "Вс",
      revenue: stats?.totalRevenue ? stats.totalRevenue * 0.1 : 34900,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Панель управления</h1>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Последние 7 дней</option>
            <option>Этот месяц</option>
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Активный парк"
          value={
            stats ? `${stats.activeVehicles}/${stats.totalVehicles}` : "-/-"
          }
          icon={Truck}
          trend={
            stats
              ? `${Math.round(
                  (stats.activeVehicles / (stats.totalVehicles || 1)) * 100
                )}%`
              : ""
          }
          trendUp={true}
        />
        <KPICard
          title="Активные заказы"
          value={stats?.activeOrders.toString() || "0"}
          icon={Package}
          trend="В работе"
          trendUp={true}
        />
        <KPICard
          title="Выручка (RUB)"
          value={`₽${stats?.totalRevenue.toLocaleString() || "0"}`}
          icon={TrendingUp}
          trend="Итого"
          trendUp={true}
        />
        <KPICard
          title="Проблемы / SOS"
          value={stats?.issuesCount.toString() || "0"}
          icon={AlertTriangle}
          trend={stats?.issuesCount > 0 ? "Требует внимания" : "Все спокойно"}
          trendUp={stats?.issuesCount === 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Аналитика выручки
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Fleet List Placeholder */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <Truck size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Статус флота</h3>
          <p className="text-slate-500 mt-2">
            Перейдите в раздел "Транспорт" для детального просмотра.
          </p>
        </div>
      </div>
    </div>
  );
};
