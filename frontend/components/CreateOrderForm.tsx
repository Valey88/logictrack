import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import { Loader2, Calculator, Truck, Package, MapPin } from "lucide-react";
import { OrderCalculateResponse } from "../types";

// 1. Zod Schema
const orderSchema = z.object({
  customerName: z.string().min(2, "Введите имя отправителя"),
  pickupAddress: z.string().min(5, "Введите адрес забора"),
  deliveryAddress: z.string().min(5, "Введите адрес доставки"),
  weight: z
    .number({ error: "Вес обязателен" })
    .min(0.1, "Минимум 0.1 кг"),
  length: z
    .number({ error: "Длина обязательна" })
    .min(1, "Мин 1 см"),
  width: z
    .number({ error: "Ширина обязательна" })
    .min(1, "Мин 1 см"),
  height: z
    .number({ error: "Высота обязательна" })
    .min(1, "Мин 1 см"),
  deliveryDate: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

// Mock coordinates (в реальном проекте здесь будет интеграция с Yandex/Google Maps)
const MOCK_PICKUP = { lat: 55.7558, lng: 37.6173 }; // Moscow
const MOCK_DELIVERY = { lat: 59.9343, lng: 30.3351 }; // St. Petersburg

interface CreateOrderFormProps {
  onSuccess?: () => void;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [calculatedData, setCalculatedData] =
    useState<OrderCalculateResponse | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: "onChange",
    defaultValues: {
      weight: 1,
      length: 20,
      width: 20,
      height: 20,
    },
  });

  // Watch fields to trigger calculation
  const [weight, length, width, height] = watch([
    "weight",
    "length",
    "width",
    "height",
  ]);

  // 2. Mutations
  const calculateMutation = useMutation({
    mutationFn: async (values: {
      weight: number;
      length: number;
      width: number;
      height: number;
    }) => {
      return await apiClient.calculatePrice({
        pickupLocation: MOCK_PICKUP,
        deliveryLocation: MOCK_DELIVERY,
        weight: values.weight,
        length: values.length,
        width: values.width,
        height: values.height,
      });
    },
    onSuccess: (data) => {
      setCalculatedData(data);
    },
    onError: () => {
      setCalculatedData(null);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiClient.createOrder(data),
    onSuccess: () => {
      alert("Заказ успешно создан! Ожидайте назначения курьера.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      alert(
        `Ошибка: ${err.response?.data?.detail || "Не удалось создать заказ"}`
      );
    },
  });

  // 3. Auto-calculate effect (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (weight > 0 && length > 0 && width > 0 && height > 0) {
        calculateMutation.mutate({ weight, length, width, height });
      }
    }, 600); // 600ms delay
    return () => clearTimeout(timer);
  }, [weight, length, width, height]);

  const onSubmit = (data: OrderFormValues) => {
    if (!calculatedData) return;

    createOrderMutation.mutate({
      customerName: data.customerName,
      pickupAddress: data.pickupAddress,
      deliveryAddress: data.deliveryAddress,
      pickupLocation: MOCK_PICKUP,
      deliveryLocation: MOCK_DELIVERY,
      weight: data.weight,
      length: data.length,
      width: data.width,
      height: data.height,
      price: calculatedData.price,
      distanceKm: calculatedData.distanceKm,
      deliveryDate: data.deliveryDate
        ? new Date(data.deliveryDate).toISOString()
        : undefined,
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        <Package className="text-blue-600" /> Оформление доставки
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Откуда забрать
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                {...register("pickupAddress")}
                className="w-full border border-slate-300 rounded-lg pl-9 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Москва, ул. Ленина 1"
              />
            </div>
            {errors.pickupAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.pickupAddress.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Куда доставить
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                {...register("deliveryAddress")}
                className="w-full border border-slate-300 rounded-lg pl-9 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Санкт-Петербург, Невский пр. 22"
              />
            </div>
            {errors.deliveryAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.deliveryAddress.message}
              </p>
            )}
          </div>
        </div>

        {/* Cargo Details */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">
            Параметры груза
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-500">Вес (кг)</span>
              <input
                type="number"
                step="0.1"
                {...register("weight", { valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
              {errors.weight && (
                <p className="text-red-500 text-xs">{errors.weight.message}</p>
              )}
            </div>
            <div>
              <span className="text-xs text-slate-500">Длина (см)</span>
              <input
                type="number"
                {...register("length", { valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-slate-500">Ширина (см)</span>
              <input
                type="number"
                {...register("width", { valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-slate-500">Высота (см)</span>
              <input
                type="number"
                {...register("height", { valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Отправитель (Имя)
            </label>
            <input
              {...register("customerName")}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              placeholder="ООО Ромашка"
            />
            {errors.customerName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.customerName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Дата отправки
            </label>
            <input
              type="date"
              {...register("deliveryDate")}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>
        </div>

        {/* Calculation Result */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
              <Calculator size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Расчетная стоимость
              </p>
              {calculateMutation.isPending ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                  <Loader2 className="animate-spin" size={16} /> Считаем...
                </div>
              ) : (
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {calculatedData
                      ? `₽ ${calculatedData.price.toLocaleString()}`
                      : "—"}
                  </h3>
                  {calculatedData && (
                    <span className="text-xs text-slate-500">
                      {calculatedData.distanceKm} км •{" "}
                      {calculatedData.chargeableWeight} расч. кг
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              !isValid || createOrderMutation.isPending || !calculatedData
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {createOrderMutation.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Truck size={20} /> Создать заказ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
