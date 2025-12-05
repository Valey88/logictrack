import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useOrders, useUpdateOrder, useVehicles } from "../services/hooks";
import { OrderStatus, VehicleStatus } from "../types";
import { MapPin, Calendar, Truck, AlertCircle, X, Check } from "lucide-react";
import { apiClient } from "../services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Columns Configuration
const COLUMNS = [
  {
    id: OrderStatus.NEW,
    title: "Новые заявки",
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: OrderStatus.IN_PROGRESS,
    title: "В пути / Назначены",
    color: "bg-orange-50 border-orange-200",
  },
  {
    id: OrderStatus.COMPLETED,
    title: "Выполнены",
    color: "bg-green-50 border-green-200",
  },
];

export const OrdersKanban: React.FC = () => {
  const queryClient = useQueryClient();

  // Data Fetching
  const { data: orders = [], isLoading } = useOrders();
  const { data: vehicles = [] } = useVehicles({ status: VehicleStatus.IDLE });

  // Local State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Mutations
  const updateOrderMutation = useUpdateOrder();

  const assignVehicleMutation = useMutation({
    mutationFn: ({
      orderId,
      vehicleId,
    }: {
      orderId: number;
      vehicleId: number;
    }) => apiClient.assignVehicle(orderId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsModalOpen(false);
      setSelectedOrderId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Ошибка назначения");
    },
  });

  // Drag & Drop Logic
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId as OrderStatus;
    const orderId = parseInt(draggableId);

    // Логика: Если перетаскиваем в IN_PROGRESS (из NEW), нужно обязательно назначить машину
    if (
      newStatus === OrderStatus.IN_PROGRESS &&
      source.droppableId === OrderStatus.NEW
    ) {
      setSelectedOrderId(orderId);
      setIsModalOpen(true);
      // Не обновляем статус сразу, ждем выбора водителя
    } else {
      // Обычное обновление статуса
      updateOrderMutation.mutate({
        id: orderId,
        data: { status: newStatus },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full gap-6 overflow-x-auto pb-4 px-1">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`flex-1 min-w-[320px] flex flex-col rounded-xl border-2 border-dashed ${col.color.replace(
                "bg-",
                "bg-opacity-30 "
              )}`}
            >
              {/* Header */}
              <div
                className={`p-4 font-bold text-slate-700 flex justify-between items-center rounded-t-xl ${col.color}`}
              >
                {col.title}
                <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-slate-100">
                  {orders.filter((o) => o.status === col.id).length}
                </span>
              </div>

              {/* Drop Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-3 space-y-3 overflow-y-auto transition-colors ${
                      snapshot.isDraggingOver ? "bg-slate-100/50" : ""
                    }`}
                  >
                    {orders
                      .filter((o) => o.status === col.id)
                      .map((order, index) => (
                        <React.Fragment key={order.id}>
                          <Draggable
                            draggableId={order.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all ${
                                  snapshot.isDragging
                                    ? "rotate-2 scale-105 shadow-xl ring-2 ring-blue-400 z-50"
                                    : ""
                                }`}
                                style={provided.draggableProps.style}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <span className="text-xs font-mono font-bold text-slate-400">
                                    #{order.id}
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    ₽{order.price.toLocaleString()}
                                  </span>
                                </div>

                                <h4 className="font-bold text-slate-900 mb-2 line-clamp-1">
                                  {order.customerName}
                                </h4>

                                <div className="space-y-2 text-xs text-slate-600 mb-3">
                                  <div className="flex items-center gap-2">
                                    <MapPin
                                      size={14}
                                      className="text-blue-500 shrink-0"
                                    />
                                    <span className="truncate">
                                      {order.deliveryAddress}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar
                                      size={14}
                                      className="text-slate-400 shrink-0"
                                    />
                                    <span>
                                      {new Date(
                                        order.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Footer Badges */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                  {order.vehicle ? (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                      <Truck size={12} />{" "}
                                      {order.vehicle.plateNumber}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                      <AlertCircle size={12} /> Ждет авто
                                    </div>
                                  )}
                                  <div className="text-xs text-slate-400 font-medium">
                                    {order.weight} кг
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        </React.Fragment>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Assign Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                Назначение транспорта
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-4">
                Выберите свободную машину для заказа{" "}
                <span className="font-bold text-slate-900">
                  #{selectedOrderId}
                </span>
                . Клиенту будет отправлено email-уведомление.
              </p>

              <div className="space-y-2">
                {vehicles.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Truck className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-500">
                      Нет свободных машин на линии
                    </p>
                  </div>
                ) : (
                  vehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() =>
                        assignVehicleMutation.mutate({
                          orderId: selectedOrderId!,
                          vehicleId: v.id,
                        })
                      }
                      disabled={assignVehicleMutation.isPending}
                      className="w-full group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {v.make} {v.model}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {v.plateNumber}
                        </div>
                      </div>
                      {v.driver ? (
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-700">
                            {v.driver.user?.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Водитель
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-red-400 bg-red-50 px-2 py-1 rounded">
                          Без водителя
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {assignVehicleMutation.isPending && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
