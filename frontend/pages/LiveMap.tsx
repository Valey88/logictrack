import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useVehicles } from "../services/hooks";
import { Vehicle, VehicleStatus } from "../types";
import { Navigation, Fuel, AlertCircle } from "lucide-react";
import { translateVehicleStatus } from "../utils/translations";

// Fix Leaflet Default Icon
const iconTruck = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const LiveMap: React.FC = () => {
  // 1. Initial Load from API
  const { data: initialVehicles, isLoading, error } = useVehicles();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (initialVehicles) {
      setVehicles(initialVehicles);
    }
  }, [initialVehicles]);

  // 2. WebSocket Connection for Real-time Updates
  useEffect(() => {
    // В Vite .env VITE_WS_URL=ws://localhost:8000/api/v1/tracking/ws
    const wsUrl =
      import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/v1/tracking/ws";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("📡 Connected to Live Tracking Stream");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Backend sends "vehicle_update"
        if (message.type === "vehicle_update" && message.data) {
          const update = message.data; // Comes in snake_case mostly, but our api helper isn't here
          // Manual mapping if needed, or rely on consistent naming
          setVehicles((prev) =>
            prev.map((v) => {
              if (v.id === update.id) {
                return {
                  ...v,
                  // Update dynamic fields
                  current_location:
                    update.current_location || v.current_location,
                  fuel_level:
                    update.fuel_level !== undefined
                      ? update.fuel_level
                      : v.fuel_level,
                  currentSpeed:
                    update.speed !== undefined ? update.speed : v.currentSpeed,
                  status: update.status || v.status,
                };
              }
              return v;
            })
          );
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, []);

  const activeCount = vehicles.filter(
    (v) =>
      v.status === VehicleStatus.ACTIVE ||
      v.status === VehicleStatus.IN_PROGRESS
  ).length;

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-red-500">
        Ошибка загрузки карты: {error.message}
      </div>
    );

  return (
    <div className="h-[calc(100vh-8rem)] w-full relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Floating Overlay Controls */}
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200 max-w-xs w-full">
        <h3 className="font-bold text-slate-800 mb-2">Мониторинг</h3>
        <div className="flex justify-between items-center text-sm text-slate-600 mb-4">
          <span>На линии:</span>
          <span className="font-mono font-bold text-blue-600">
            {activeCount} / {vehicles.length}
          </span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`w-full text-left p-2 rounded text-xs flex justify-between items-center transition-colors ${
                selectedVehicleId === v.id
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-slate-100"
              }`}
            >
              <span className="font-bold">{v.plate_number}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    v.status === VehicleStatus.ACTIVE
                      ? "bg-green-500"
                      : v.status === VehicleStatus.SOS
                      ? "bg-red-500"
                      : "bg-slate-300"
                  }`}
                ></span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={[55.7558, 37.6173]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vehicles.map(
          (vehicle) =>
            vehicle.current_location && (
              <Marker
                key={vehicle.id}
                position={[
                  vehicle.current_location.lat,
                  vehicle.current_location.lng,
                ]}
                icon={iconTruck}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center justify-between mb-2 border-b pb-2">
                      <h3 className="font-bold text-lg">
                        {vehicle.plate_number}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded font-bold text-white ${
                          vehicle.status === VehicleStatus.SOS
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {translateVehicleStatus(vehicle.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <div className="flex items-center gap-2">
                        <Fuel size={14} className="text-blue-500" />
                        <span>Топливо: {vehicle.fuel_level?.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-purple-500" />
                        <span>
                          Скорость: {vehicle.currentSpeed?.toFixed(0)} км/ч
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
        )}
      </MapContainer>
    </div>
  );
};
