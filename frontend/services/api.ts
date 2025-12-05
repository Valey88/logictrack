import axios, { AxiosInstance, AxiosError } from "axios";
import {
  Order,
  Vehicle,
  User,
  Driver,
  MaintenanceRecord,
  FuelLog,
  FuelAnalysisResult,
  DashboardStats,
  OrderCalculateRequest,
  OrderCalculateResponse,
  OrderCreateRequest,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Утилиты конвертации (Snake <-> Camel) ---
const toCamel = (s: string) => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

const toSnake = (s: string) => {
  return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const keysToCamel = (o: any): any => {
  if (o === null || o === undefined) {
    return o;
  }
  if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }
  if (o === Object(o) && typeof o !== "function") {
    const n: any = {};
    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;
  }
  return o;
};

const keysToSnake = (o: any): any => {
  if (o === Object(o) && !Array.isArray(o) && typeof o !== "function") {
    const n: any = {};
    Object.keys(o).forEach((k) => {
      n[toSnake(k)] = keysToSnake(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => keysToSnake(i));
  }
  return o;
};

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.data && !(config.data instanceof FormData)) {
        config.data = keysToSnake(config.data);
      }
      if (config.params) {
        config.params = keysToSnake(config.params);
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        if (response.data) {
          const originalAccessToken = response.data.access_token;
          response.data = keysToCamel(response.data);
          if (originalAccessToken) {
            response.data.accessToken = originalAccessToken;
          }
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          // window.location.href = "/login"; // Uncomment in prod
        }
        return Promise.reject(error);
      }
    );
  }

  // --- Auth ---
  async login(email: string, password: string) {
    const response = await this.client.post("/auth/login", { email, password });
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post("/auth/register", data);
    return response.data;
  }

  async getMe() {
    const response = await this.client.get("/auth/me");
    return response.data;
  }

  // --- Orders ---
  async getOrders(params?: any) {
    const response = await this.client.get("/orders", { params });
    return response.data;
  }

  async createOrder(data: OrderCreateRequest) {
    const response = await this.client.post("/orders", data);
    return response.data;
  }

  async updateOrder(id: number, data: any) {
    const response = await this.client.patch(`/orders/${id}`, data);
    return response.data;
  }

  // === НОВЫЕ МЕТОДЫ ===
  async calculatePrice(
    data: OrderCalculateRequest
  ): Promise<OrderCalculateResponse> {
    const response = await this.client.post("/orders/calculate", data);
    return response.data;
  }

  async assignVehicle(orderId: number, vehicleId: number) {
    const response = await this.client.patch(`/orders/${orderId}/assign`, {
      vehicleId,
    });
    return response.data;
  }
  // ====================

  async searchOrderByCode(code: string) {
    try {
      const orderId = parseInt(code);
      if (!isNaN(orderId)) {
        const response = await this.client.get(`/orders/${orderId}`);
        return response.data;
      }
      throw new Error("Invalid ID format");
    } catch (error) {
      throw error;
    }
  }

  async getOrder(id: number) {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  // --- Vehicles ---
  async getVehicles(params?: any) {
    const response = await this.client.get("/vehicles", { params });
    return response.data;
  }

  async getVehicle(id: string | number) {
    const response = await this.client.get(`/vehicles/${id}`);
    return response.data;
  }

  async createVehicle(data: any) {
    const response = await this.client.post("/vehicles", data);
    return response.data;
  }

  async updateVehicle(id: number, data: any) {
    const response = await this.client.patch(`/vehicles/${id}`, data);
    return response.data;
  }
  // --- Drivers ---
  async getDrivers() {
    const response = await this.client.get("/drivers");
    return response.data;
  }

  async createDriverWithUser(data: any) {
    const response = await this.client.post("/drivers/with-user", data);
    return response.data;
  }

  // --- Maintenance ---
  async getMaintenanceRecords(vehicleId?: string) {
    const params = vehicleId ? { vehicle_id: vehicleId } : {};
    const response = await this.client.get("/maintenance", { params });
    return response.data;
  }

  async createMaintenanceRecord(data: any) {
    const response = await this.client.post("/maintenance", data);
    return response.data;
  }

  // --- Fuel ---
  async getFuelLogs(vehicleId?: string) {
    const params = vehicleId ? { vehicle_id: vehicleId } : {};
    const response = await this.client.get("/fuel", { params });
    return response.data;
  }

  async getFuelAnalytics() {
    const response = await this.client.get("/fuel/analytics/overconsumption");
    return response.data;
  }

  // --- Dashboard & Tracking ---
  async getVehicleTrackingHistory(vehicleId: number, limit = 100) {
    const response = await this.client.get(
      `/tracking/vehicles/${vehicleId}/history`,
      { params: { limit } }
    );
    return response.data;
  }

  async getDashboardStats() {
    const response = await this.client.get("/dashboard/stats");
    return response.data;
  }
}

export const apiClient = new ApiClient();
