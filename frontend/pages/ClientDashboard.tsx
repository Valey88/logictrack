import React, { useState } from "react";
import { Package, Clock, Plus, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { OrderStatus } from "../types";
import { translateOrderStatus } from "../utils/translations";
import { useOrders } from "../services/hooks";
import { CreateOrderForm } from "../components/CreateOrderForm";

export const ClientDashboard: React.FC = () => {
  const { data: myOrders = [], isLoading } = useOrders();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case OrderStatus.IN_PROGRESS:
        return "bg-orange-100 text-orange-700 border-orange-200";
      case OrderStatus.COMPLETED:
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Личный кабинет</h1>
          <p className="text-slate-500 mt-1">
            Управляйте вашими отправлениями и отслеживайте грузы
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          {isFormOpen ? (
            "Закрыть форму"
          ) : (
            <>
              <Plus size={20} /> Новый заказ
            </>
          )}
        </button>
      </div>

      {/* Form Area */}
      {isFormOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CreateOrderForm onSuccess={() => setIsFormOpen(false)} />
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Ваши заказы</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myOrders.length > 0 ? (
          <div className="grid gap-4">
            {myOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
              >
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center justify-between lg:justify-start gap-4">
                    <span className="font-mono font-bold text-slate-400 text-lg">
                      #{order.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {translateOrderStatus(order.status)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center text-sm">
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 font-bold uppercase mb-1">
                        Откуда
                      </div>
                      <div className="font-medium text-black">
                        {order.pickupAddress}
                      </div>
                    </div>
                    <ArrowRight className="hidden sm:block text-slate-300" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 font-bold uppercase mb-1">
                        Куда
                      </div>
                      <div className="font-medium text-slate-900">
                        {order.deliveryAddress}
                      </div>
                    </div>
                  </div>

                  {order.deliveryDate && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg w-fit">
                      <Clock size={14} />
                      Доставка:{" "}
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  <div className="text-left lg:text-right flex-1">
                    <div className="text-2xl font-black text-slate-900">
                      ₽{order.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">
                      {order.distanceKm} км • {order.weight} кг
                    </div>
                  </div>

                  <Link
                    to={`/track/${order.id}`}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Package size={16} />
                    Трекинг
                    <ExternalLink size={14} className="opacity-50" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">
              Список заказов пуст
            </h3>
            <p className="text-slate-500 mb-6">
              Оформите вашу первую доставку прямо сейчас.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-blue-600 font-bold hover:underline"
            >
              Создать заказ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
