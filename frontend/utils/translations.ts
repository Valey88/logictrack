import { OrderStatus, VehicleStatus, MaintenanceStatus } from "../types";

export const translateOrderStatus = (status: OrderStatus): string => {
  const translations: Record<OrderStatus, string> = {
    [OrderStatus.NEW]: "Новый",
    [OrderStatus.IN_PROGRESS]: "В работе",
    [OrderStatus.COMPLETED]: "Завершен",
    [OrderStatus.CANCELLED]: "Отменен",
  };
  return translations[status] || status;
};

export const translateVehicleStatus = (status: VehicleStatus): string => {
  const translations: Record<VehicleStatus, string> = {
    [VehicleStatus.ACTIVE]: "Активен",
    [VehicleStatus.IN_PROGRESS]: "В работе",
    [VehicleStatus.MAINTENANCE]: "На обслуживании",
    [VehicleStatus.IDLE]: "Простой",
    [VehicleStatus.SOS]: "SOS",
  };
  return translations[status] || status;
};

export const translateMaintenanceStatus = (
  status: MaintenanceStatus
): string => {
  const translations: Record<MaintenanceStatus, string> = {
    [MaintenanceStatus.SCHEDULED]: "Запланировано",
    [MaintenanceStatus.COMPLETED]: "Завершено",
  };
  return translations[status] || status;
};
