import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api";
import {
  Order,
  Vehicle,
  OrderStatus,
  VehicleStatus,
  Driver,
  MaintenanceRecord,
  FuelLog,
  FuelAnalysisResult,
  DashboardStats,
} from "../types";

// --- Orders ---
export const useOrders = (params?: {
  status?: OrderStatus;
  customer_id?: number;
  vehicle_id?: number;
}) => {
  return useQuery<Order[]>({
    queryKey: ["orders", params],
    queryFn: () => apiClient.getOrders(params),
  });
};

export const useOrder = (id: number) => {
  return useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => apiClient.getOrder(id),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.updateOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useSearchOrder = () => {
  return useMutation({
    mutationFn: (code: string) => apiClient.searchOrderByCode(code),
  });
};

// --- Vehicles ---
export const useVehicles = (params?: {
  status?: VehicleStatus;
  search?: string;
}) => {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles", params],
    queryFn: () => apiClient.getVehicles(params),
    staleTime: 0, // Всегда получать свежие данные
    refetchOnWindowFocus: true, // Обновлять при фокусе окна
  });
};

export const useVehicle = (id: string) => {
  return useQuery<Vehicle>({
    queryKey: ["vehicle", id],
    queryFn: () => apiClient.getVehicle(id),
    enabled: !!id,
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createVehicle(data),
    onSuccess: async () => {
      // Инвалидируем и сразу обновляем список транспорта
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      await queryClient.refetchQueries({ queryKey: ["vehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.updateVehicle(id, data),
    onSuccess: (_, variables) => {
      // Обновляем список всех машин и детали конкретной машины
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({
        queryKey: ["vehicle", variables.id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["vehicle", variables.id] }); // на случай если id число
    },
  });
};

// --- Drivers ---
export const useDrivers = () => {
  return useQuery<Driver[]>({
    queryKey: ["drivers"],
    queryFn: () => apiClient.getDrivers(),
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDriverWithUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });
};

export const useCreateDriverWithUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDriverWithUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });
};

// --- Maintenance ---
export const useMaintenanceRecords = (vehicleId?: string) => {
  return useQuery<MaintenanceRecord[]>({
    queryKey: ["maintenance", vehicleId],
    queryFn: () => apiClient.getMaintenanceRecords(vehicleId),
  });
};

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createMaintenanceRecord(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
  });
};

// --- Fuel ---
export const useFuelLogs = (vehicleId?: string) => {
  return useQuery<FuelLog[]>({
    queryKey: ["fuel", vehicleId],
    queryFn: () => apiClient.getFuelLogs(vehicleId),
  });
};

export const useFuelAnalytics = () => {
  return useQuery<FuelAnalysisResult[]>({
    queryKey: ["fuel-analytics"],
    queryFn: () => apiClient.getFuelAnalytics(),
  });
};

// --- Dashboard & Tracking ---
export const useVehicleTrackingHistory = (vehicleId: number) => {
  return useQuery({
    queryKey: ["tracking", vehicleId],
    queryFn: () => apiClient.getVehicleTrackingHistory(vehicleId),
    enabled: !!vehicleId,
  });
};

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiClient.getDashboardStats(),
  });
};
