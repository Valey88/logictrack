
import React, { useState, useEffect } from 'react';
import { Search, Package, Truck, CheckCircle, MapPin, Clock, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_ORDERS, MOCK_VEHICLES } from '../constants';
import { Order, OrderStatus, Vehicle } from '../types';
import { simulateMovement } from '../services/simulationService';

// Fix Leaflet Icon
const iconTruck = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export const ClientTracking: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Simulation effect for live vehicle movement on the client map
  useEffect(() => {
    if (!assignedVehicle) return;

    const interval = setInterval(() => {
      // Simulate fetching latest position from backend
      // In this mock, we just use the simulation service logic locally
      setAssignedVehicle(current => {
        if (!current) return null;
        const updated = simulateMovement([current])[0];
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [assignedVehicle?.id]); // Re-run if vehicle ID changes, but practically stable here

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearchedOrder(null);
    setAssignedVehicle(null);

    // Simulate API delay
    setTimeout(() => {
      const order = MOCK_ORDERS.find(o => o.id.toLowerCase() === orderId.toLowerCase());
      
      if (order) {
        setSearchedOrder(order);
        if (order.assignedVehicleId) {
          const vehicle = MOCK_VEHICLES.find(v => v.id === order.assignedVehicleId);
          setAssignedVehicle(vehicle || null);
        }
      } else {
        setError('Order not found. Please check the tracking ID.');
      }
      setLoading(false);
    }, 800);
  };

  // Helper to render timeline steps
  const renderTimelineStep = (stepStatus: OrderStatus, label: string, currentStatus: OrderStatus) => {
    const statusOrder = [OrderStatus.NEW, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    let stateClass = 'bg-slate-200 text-slate-400';
    if (stepIndex < currentIndex) stateClass = 'bg-green-500 text-white'; // Completed step
    else if (stepIndex === currentIndex) stateClass = 'bg-blue-600 text-white ring-4 ring-blue-100'; // Current step

    return (
      <div className="flex flex-col items-center relative z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${stateClass}`}>
          {stepIndex < currentIndex ? <CheckCircle size={16} /> : stepIndex + 1}
        </div>
        <div className="mt-2 text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</div>
      </div>
    );
  };

  const getProgressWidth = (status: OrderStatus) => {
    if (status === OrderStatus.NEW) return '0%';
    if (status === OrderStatus.IN_PROGRESS) return '50%';
    if (status === OrderStatus.COMPLETED) return '100%';
    return '0%';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Track Your Shipment</h1>
        <p className="text-slate-500">Enter your order ID to see real-time status updates.</p>
      </div>

      {/* Search Box */}
      <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 max-w-xl mx-auto flex items-center">
        <div className="pl-4 text-slate-400">
          <Search size={24} />
        </div>
        <form onSubmit={handleTrack} className="flex-1 flex">
            <input 
            type="text" 
            placeholder="e.g. ord-001" 
            className="w-full px-4 py-3 text-lg outline-none text-slate-900 placeholder:text-slate-300"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            />
            <button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
            {loading ? 'Searching...' : 'Track'}
            </button>
        </form>
      </div>

      {error && (
        <div className="max-w-xl mx-auto bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-fade-in">
            <div className="bg-red-100 p-2 rounded-full"><Package size={20} /></div>
            <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Result View */}
      {searchedOrder && (
        <div className="space-y-6 animate-fade-in">
            
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</div>
                        <h2 className="text-2xl font-black text-slate-900">{searchedOrder.id}</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Delivery</div>
                        <div className="text-lg font-bold text-blue-600 flex items-center gap-2">
                            <Clock size={18} />
                            {new Date(searchedOrder.deliveryDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="p-8 sm:p-12">
                    {/* Timeline Container */}
                    <div className="relative">
                        {/* Progress Line Background */}
                        <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
                        
                        {/* Active Progress Line */}
                        <div 
                            className="absolute top-4 left-0 h-1 bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: getProgressWidth(searchedOrder.status) }}
                        ></div>

                        {/* Steps */}
                        <div className="flex justify-between relative">
                            {renderTimelineStep(OrderStatus.NEW, 'Order Placed', searchedOrder.status)}
                            {renderTimelineStep(OrderStatus.IN_PROGRESS, 'On The Way', searchedOrder.status)}
                            {renderTimelineStep(OrderStatus.COMPLETED, 'Delivered', searchedOrder.status)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Package className="text-blue-500" /> Shipment Details
                        </h3>
                        <div className="space-y-4 relative">
                            <div className="absolute left-[11px] top-8 bottom-4 w-0.5 bg-slate-100"></div>
                            
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-300 rounded-full z-10"></div>
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">From</div>
                                <div className="font-medium text-slate-900">{searchedOrder.pickupAddress}</div>
                            </div>
                            
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-6 h-6 bg-blue-600 border-4 border-white rounded-full z-10 shadow-sm"></div>
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">To</div>
                                <div className="font-medium text-slate-900">{searchedOrder.deliveryAddress}</div>
                            </div>
                        </div>
                    </div>

                    {assignedVehicle && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Truck className="text-blue-500" /> Courier Info
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Truck size={24} className="text-slate-500" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">{assignedVehicle.make} {assignedVehicle.model}</div>
                                    <div className="text-sm text-slate-500">Plate: {assignedVehicle.plateNumber}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Map Column */}
                <div className="lg:col-span-2 h-[400px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
                    {assignedVehicle ? (
                         <MapContainer 
                            center={[assignedVehicle.currentLocation.lat, assignedVehicle.currentLocation.lng]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                        >
                            <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker 
                                position={[assignedVehicle.currentLocation.lat, assignedVehicle.currentLocation.lng]}
                                icon={iconTruck}
                            >
                                <Popup className="font-sans">
                                    <div className="text-center">
                                        <div className="font-bold text-slate-900">Your Courier</div>
                                        <div className="text-xs text-slate-500">Updating live...</div>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                            {searchedOrder.status === OrderStatus.NEW ? (
                                <>
                                    <Clock size={48} className="mb-4 opacity-50" />
                                    <p>Courier is being assigned...</p>
                                </>
                            ) : (
                                <>
                                    <MapPin size={48} className="mb-4 opacity-50" />
                                    <p>Tracking map unavailable for completed orders.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
