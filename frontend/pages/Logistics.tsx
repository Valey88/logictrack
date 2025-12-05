import React from "react";
import { OrdersKanban } from "../components/OrdersKanban";

export const Logistics: React.FC = () => {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Управление заказами
          </h1>
          <p className="text-sm text-slate-500">
            Перетаскивайте карточки для смены статуса
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <OrdersKanban />
      </div>
    </div>
  );
};
