export enum UserRole {
  ADMIN = "ADMIN",
  DISPATCHER = "DISPATCHER",
  DRIVER = "DRIVER",
  CLIENT = "CLIENT",
}

export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  MAINTENANCE = "MAINTENANCE",
  IDLE = "IDLE",
  SOS = "SOS",
  IN_PROGRESS = "IN_PROGRESS",
}

export enum OrderStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface User {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
}

export interface Driver {
  id: number;
  userId?: number;
  licenseNumber?: string;
  rating: number;
  avatarUrl?: string;
  user?: User;
}

export interface Vehicle {
  id: number;
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  status: VehicleStatus;
  driverId?: number;
  currentLocation?: Coordinates;
  fuelLevel: number;
  normConsumption: number;
  currentSpeed?: number;
  mileage?: number;
  driver?: Driver;
}

// === ОБНОВЛЕННЫЙ ИНТЕРФЕЙС ORDER ===
export interface Order {
  id: number;
  customerId: number;
  vehicleId?: number;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: OrderStatus;

  // Новые поля (синхронизация с бекендом)
  weight: number;
  volume: number;
  dimensions?: string;
  distanceKm: number;
  price: number;

  createdAt: string;
  deliveryDate?: string;
  completedAt?: string;
  vehicle?: Vehicle;
}

// === ТИПЫ ДЛЯ КАЛЬКУЛЯТОРА ===
export interface OrderCalculateRequest {
  pickupLocation: Coordinates;
  deliveryLocation: Coordinates;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface OrderCalculateResponse {
  price: number;
  distanceKm: number;
  volumeM3: number;
  chargeableWeight: number;
}

export interface OrderCreateRequest extends OrderCalculateRequest {
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  price: number;
  distanceKm: number;
  deliveryDate?: string;
}

export interface FuelLog {
  id: number;
  vehicleId: number;
  date: string;
  liters: number;
  cost: number;
  mileage: number;
  location?: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  scheduledDate: string;
  type: string;
  cost: number;
  status: MaintenanceStatus;
  completedDate?: string;
  vehicle?: Vehicle;
}

export interface DashboardStats {
  activeVehicles: number;
  totalVehicles: number;
  activeOrders: number;
  totalRevenue: number;
  issuesCount: number;
}

export interface FuelAnalysisResult {
  vehicleId: number;
  plateNumber: string;
  make: string;
  model: string;
  actualConsumption: number;
  normConsumption: number;
  overconsumption: number;
  difference?: number;
  totalDistance?: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}
