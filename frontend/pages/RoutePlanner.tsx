
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign, 
  Plus,
  RotateCcw
} from 'lucide-react';
import L from 'leaflet';
import { calculateDistanceKm } from '../services/simulationService';
import { Coordinates } from '../types';

// Icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Click Handler Component
const MapClickHandler = ({ onMapClick }: { onMapClick: (latlng: Coordinates) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

export const RoutePlanner: React.FC = () => {
  const [startPoint, setStartPoint] = useState<Coordinates | null>(null);
  const [endPoint, setEndPoint] = useState<Coordinates | null>(null);
  const [settingMode, setSettingMode] = useState<'START' | 'END'>('START');

  const handleMapClick = (coords: Coordinates) => {
    if (settingMode === 'START') {
      setStartPoint(coords);
      setSettingMode('END');
    } else {
      setEndPoint(coords);
      setSettingMode('START'); // Reset cycle or stay on end
    }
  };

  const resetMap = () => {
    setStartPoint(null);
    setEndPoint(null);
    setSettingMode('START');
  };

  const distance = startPoint && endPoint ? calculateDistanceKm(startPoint, endPoint) : 0;
  const estimatedTime = distance > 0 ? Math.round((distance / 60) * 60 + 30) : 0; // Avg 60km/h + 30m loading
  const estimatedCost = distance > 0 ? Math.round(distance * 50 + 2000) : 0; // 50 rub/km + base

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Route Planner</h1>
            <p className="text-slate-500 text-sm">Click map to set points.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${settingMode === 'START' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`} onClick={() => setSettingMode('START')}>
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Point A (Start)</div>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <MapPin className="text-green-600" size={18} />
                    {startPoint ? `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` : 'Click to set on map'}
                </div>
            </div>

            <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${settingMode === 'END' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`} onClick={() => setSettingMode('END')}>
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Point B (End)</div>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                    <MapPin className="text-red-600" size={18} />
                    {endPoint ? `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` : 'Click to set on map'}
                </div>
            </div>

            <button 
                onClick={resetMap}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 py-2"
            >
                <RotateCcw size={16} /> Reset Points
            </button>
        </div>

        {distance > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Route Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-slate-500 mb-1 flex items-center gap-1"><Navigation size={12}/> Distance</div>
                        <div className="text-lg font-bold text-slate-900">{distance.toFixed(1)} km</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 mb-1 flex items-center gap-1"><Clock size={12}/> Est. Time</div>
                        <div className="text-lg font-bold text-slate-900">{Math.floor(estimatedTime / 60)}h {estimatedTime % 60}m</div>
                    </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-green-800 font-medium flex items-center gap-2"><DollarSign size={16}/> Est. Cost</span>
                    <span className="text-xl font-bold text-green-700">₽{estimatedCost.toLocaleString()}</span>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all">
                    <Plus size={20} /> Create Order
                </button>
            </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
         <MapContainer 
            center={[55.75, 37.61]} 
            zoom={10} 
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            
            {startPoint && (
                <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
                    <Popup>Start Point</Popup>
                </Marker>
            )}
            
            {endPoint && (
                <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
                    <Popup>End Point</Popup>
                </Marker>
            )}

            {startPoint && endPoint && (
                <Polyline 
                    positions={[
                        [startPoint.lat, startPoint.lng],
                        [endPoint.lat, endPoint.lng]
                    ]}
                    pathOptions={{ color: 'blue', weight: 4, dashArray: '10, 10', opacity: 0.6 }}
                />
            )}
        </MapContainer>
        
        {/* Floating Hint */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium text-slate-600 border border-slate-200">
            {settingMode === 'START' ? 'Step 1: Click map to set Start Point' : 'Step 2: Click map to set Destination'}
        </div>
      </div>
    </div>
  );
};
