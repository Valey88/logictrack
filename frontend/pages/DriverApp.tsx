
import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  Fuel, 
  CheckCircle,
  Clock,
  ChevronRight,
  Menu
} from 'lucide-react';

// Mock current task state for demo
type TaskStep = 'TO_PICKUP' | 'AT_PICKUP' | 'TO_DELIVERY' | 'AT_DELIVERY' | 'COMPLETED';

export const DriverApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<TaskStep>('TO_PICKUP');
  const [isShiftActive, setIsShiftActive] = useState(true);

  // Mock Data for the specific driver view
  const activeOrder = {
    id: 'ORD-3942',
    customer: 'TechCorp Logistics',
    pickup: {
      address: 'Sheremetyevo Cargo Terminal, Gate 4',
      time: '14:00',
      contact: '+7 999 000-00-00'
    },
    delivery: {
      address: 'Moscow City, Tower A, Loading Bay 2',
      time: '16:30',
      contact: '+7 999 111-11-11'
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'TO_PICKUP': setCurrentStep('AT_PICKUP'); break;
      case 'AT_PICKUP': setCurrentStep('TO_DELIVERY'); break;
      case 'TO_DELIVERY': setCurrentStep('AT_DELIVERY'); break;
      case 'AT_DELIVERY': setCurrentStep('COMPLETED'); break;
      case 'COMPLETED': setCurrentStep('TO_PICKUP'); break; // Reset for demo
    }
  };

  const getStepLabel = () => {
    switch (currentStep) {
      case 'TO_PICKUP': return 'En Route to Pickup';
      case 'AT_PICKUP': return 'Loading Cargo';
      case 'TO_DELIVERY': return 'En Route to Delivery';
      case 'AT_DELIVERY': return 'Unloading';
      case 'COMPLETED': return 'Ride Completed';
    }
  };

  const getProgressPercent = () => {
    switch (currentStep) {
      case 'TO_PICKUP': return 10;
      case 'AT_PICKUP': return 35;
      case 'TO_DELIVERY': return 60;
      case 'AT_DELIVERY': return 85;
      case 'COMPLETED': return 100;
    }
  };

  if (!isShiftActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-100 p-6">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <Clock size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Shift Ended</h2>
        <p className="text-slate-500 text-center mb-8">You are currently offline. Start your shift to receive new orders.</p>
        <button 
          onClick={() => setIsShiftActive(true)}
          className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Start Shift
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-white shadow-xl overflow-hidden rounded-xl border border-slate-200">
      
      {/* Top Bar */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">IP</div>
          <div>
            <div className="font-bold">Ivan Petrov</div>
            <div className="text-xs text-slate-400">Volvo FH16 • A 123 AA 777</div>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsShiftActive(false)}
                className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-xs font-bold uppercase tracking-wider"
            >
                End Shift
            </button>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
        
        {/* Progress Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Current Task</span>
                <span className="text-xs font-bold text-slate-400">{activeOrder.id}</span>
            </div>
            
            <div className="mb-6 text-center">
                <div className="text-3xl font-black text-slate-900 mb-1">{getStepLabel()}</div>
                <div className="text-slate-500 text-sm">Next: Confirm via app</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-2">
                <div 
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${getProgressPercent()}%` }}
                />
            </div>
        </div>

        {/* Dynamic Route Info */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            {/* Pickup Node */}
            <div className={`relative pl-8 ${['TO_DELIVERY', 'AT_DELIVERY', 'COMPLETED'].includes(currentStep) ? 'opacity-50 grayscale' : ''}`}>
                <div className="absolute left-0 top-1">
                    <div className="h-4 w-4 rounded-full border-2 border-blue-600 bg-white"></div>
                    <div className="absolute left-2 top-4 w-0.5 h-16 bg-slate-200 -ml-px"></div>
                </div>
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Pickup • {activeOrder.pickup.time}</div>
                <div className="font-bold text-slate-900 text-lg leading-tight mb-2">{activeOrder.pickup.address}</div>
                <button className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <Navigation size={16} /> Navigate
                </button>
            </div>

            {/* Delivery Node */}
            <div className={`relative pl-8 ${['TO_PICKUP', 'AT_PICKUP'].includes(currentStep) ? 'opacity-50' : ''}`}>
                 <div className="absolute left-0 top-1">
                    <div className="h-4 w-4 rounded-full border-2 border-slate-400 bg-white"></div>
                </div>
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Delivery • {activeOrder.delivery.time}</div>
                <div className="font-bold text-slate-900 text-lg leading-tight mb-2">{activeOrder.delivery.address}</div>
                <div className="flex gap-4">
                     <button className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                        <Navigation size={16} /> Navigate
                    </button>
                    <button className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                        <Phone size={16} /> Call Client
                    </button>
                </div>
            </div>
        </div>

      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-slate-200 p-4 space-y-3 shrink-0 pb-6">
        
        {/* Primary Action Button */}
        {currentStep !== 'COMPLETED' ? (
             <button 
                onClick={handleNextStep}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
            >
                <span className="font-bold text-lg">
                    {currentStep === 'TO_PICKUP' && "I've Arrived at Pickup"}
                    {currentStep === 'AT_PICKUP' && "Cargo Loaded"}
                    {currentStep === 'TO_DELIVERY' && "I've Arrived at Delivery"}
                    {currentStep === 'AT_DELIVERY' && "Confirm Delivery"}
                </span>
                <div className="bg-white/20 p-2 rounded-lg">
                    <ChevronRight size={24} />
                </div>
            </button>
        ) : (
            <button 
                onClick={handleNextStep}
                className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            >
                <CheckCircle /> Complete Order
            </button>
        )}

        {/* Utility Grid */}
        <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 bg-slate-100 rounded-lg text-slate-700 font-bold hover:bg-slate-200">
                <Fuel size={20} /> Refuel
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 border border-red-100">
                <AlertTriangle size={20} /> SOS
            </button>
        </div>

      </div>
    </div>
  );
};
