import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useOrder, useVehicleTrackingHistory } from "../services/hooks";
import { OrderStatus, Coordinates } from "../types";
import { useAuth } from "../contexts/AuthContext";

// Fix Leaflet Icon
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

export const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const orderIdNum = orderId ? parseInt(orderId) : null;

  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderIdNum || 0);
  const { data: trackingHistory } = useVehicleTrackingHistory(
    order?.vehicle_id || 0
  );

  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null
  );

  useEffect(() => {
    if (trackingHistory && trackingHistory.length > 0) {
      const latest = trackingHistory[0];
      setCurrentLocation(latest.location);
    } else if (order?.vehicle?.current_location) {
      setCurrentLocation(order.vehicle.current_location);
    }
  }, [trackingHistory, order]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && orderId) {
      navigate(`/login?orderCode=${orderId}`);
    }
  }, [isAuthenticated, navigate, orderId]);

  if (orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Загрузка информации о заказе...</p>
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Package className="mx-auto mb-4 text-slate-300" size={64} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Заказ не найден
          </h2>
          <p className="text-slate-600 mb-6">
            Заказ, который вы ищете, не существует или у вас нет доступа к нему.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const renderTimelineStep = (
    stepStatus: OrderStatus,
    label: string,
    currentStatus: OrderStatus
  ) => {
    const statusOrder = [
      OrderStatus.NEW,
      OrderStatus.IN_PROGRESS,
      OrderStatus.COMPLETED,
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    let stateClass = "bg-slate-200 text-slate-400";
    if (stepIndex < currentIndex) stateClass = "bg-green-500 text-white";
    else if (stepIndex === currentIndex)
      stateClass = "bg-blue-600 text-white ring-4 ring-blue-100";

    return (
      <div className="flex flex-col items-center relative z-10">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${stateClass}`}
        >
          {stepIndex < currentIndex ? <CheckCircle size={16} /> : stepIndex + 1}
        </div>
        <div className="mt-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
          {label}
        </div>
      </div>
    );
  };

  const getProgressWidth = (status: OrderStatus) => {
    if (status === OrderStatus.NEW) return "0%";
    if (status === OrderStatus.IN_PROGRESS) return "50%";
    if (status === OrderStatus.COMPLETED) return "100%";
    return "0%";
  };

  const mapCenter =
    currentLocation ||
    (order.vehicle?.current_location
      ? {
          lat: order.vehicle.current_location.lat,
          lng: order.vehicle.current_location.lng,
        }
      : { lat: 55.7558, lng: 37.6173 });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Отслеживание груза
        </h1>
        <p className="text-slate-500">Заказ №{order.id}</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Номер заказа
            </div>
            <h2 className="text-2xl font-black text-slate-900">#{order.id}</h2>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Планируемая доставка
            </div>
            <div className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <Clock size={18} />
              {order.delivery_date
                ? new Date(order.delivery_date).toLocaleDateString()
                : "TBD"}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          {/* Timeline Container */}
          <div className="relative">
            <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
            <div
              className="absolute top-4 left-0 h-1 bg-blue-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: getProgressWidth(order.status) }}
            ></div>
            <div className="flex justify-between relative">
              {renderTimelineStep(
                OrderStatus.NEW,
                "Заказ создан",
                order.status
              )}
              {renderTimelineStep(
                OrderStatus.IN_PROGRESS,
                "В пути",
                order.status
              )}
              {renderTimelineStep(
                OrderStatus.COMPLETED,
                "Доставлено",
                order.status
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="text-blue-500" /> Детали груза
            </h3>
            <div className="space-y-4 relative">
              <div className="absolute left-[11px] top-8 bottom-4 w-0.5 bg-slate-100"></div>

              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-300 rounded-full z-10"></div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                  Откуда
                </div>
                <div className="font-medium text-slate-900">
                  {order.pickup_address}
                </div>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-6 h-6 bg-blue-600 border-4 border-white rounded-full z-10 shadow-sm"></div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                  Куда
                </div>
                <div className="font-medium text-slate-900">
                  {order.delivery_address}
                </div>
              </div>
            </div>
          </div>

          {order.vehicle && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Truck className="text-blue-500" /> Информация о курьере
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <Truck size={24} className="text-slate-500" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {order.vehicle.make} {order.vehicle.model}
                  </div>
                  <div className="text-sm text-slate-500">
                    Гос. номер: {order.vehicle.plate_number}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Column */}
        <div className="lg:col-span-2 h-[400px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
          {order.vehicle && currentLocation ? (
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[mapCenter.lat, mapCenter.lng]}
                icon={iconTruck}
              >
                <Popup className="font-sans">
                  <div className="text-center">
                    <div className="font-bold text-slate-900">Ваш курьер</div>
                    <div className="text-xs text-slate-500">
                      Обновление в реальном времени...
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
              {order.status === OrderStatus.NEW ? (
                <>
                  <Clock size={48} className="mb-4 opacity-50" />
                  <p>Курьер назначается...</p>
                </>
              ) : (
                <>
                  <MapPin size={48} className="mb-4 opacity-50" />
                  <p>Карта отслеживания недоступна.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
