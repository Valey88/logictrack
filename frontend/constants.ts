import { Vehicle, VehicleStatus, Driver, Order, OrderStatus, FuelLog, MaintenanceRecord } from './types';

// Mock Drivers
export const MOCK_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Ivan Petrov', phone: '+7 900 123 45 67', rating: 4.8 },
  { id: 'd2', name: 'Alexey Smirnov', phone: '+7 900 987 65 43', rating: 4.5 },
  { id: 'd3', name: 'Elena Volkova', phone: '+7 900 555 11 22', rating: 4.9 },
];

// Mock Vehicles (Starting positions around Moscow for demo)
export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    vin: '1HGCM82633A004352',
    plateNumber: 'A 123 AA 777',
    make: 'Volvo',
    model: 'FH16',
    status: VehicleStatus.ACTIVE,
    driverId: 'd1',
    currentLocation: { lat: 55.7558, lng: 37.6173 },
    fuelLevel: 75,
    normConsumption: 30.0, // Truck consumption
  },
  {
    id: 'v2',
    vin: 'WDB9066331S476211',
    plateNumber: 'B 456 BB 777',
    make: 'Mercedes',
    model: 'Sprinter',
    status: VehicleStatus.IN_PROGRESS, // Used as 'Moving' in logic
    driverId: 'd2',
    currentLocation: { lat: 55.78, lng: 37.55 },
    fuelLevel: 40,
    normConsumption: 12.5,
  },
  {
    id: 'v3',
    vin: 'JMZCR193500127456',
    plateNumber: 'C 789 CC 777',
    make: 'Ford',
    model: 'Transit',
    status: VehicleStatus.MAINTENANCE,
    driverId: 'd3',
    currentLocation: { lat: 55.72, lng: 37.65 },
    fuelLevel: 90,
    normConsumption: 11.0,
  },
];

// Mock Orders
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    customerName: 'TechCorp Logistics',
    pickupAddress: 'Sheremetyevo Cargo Terminal',
    deliveryAddress: 'Moscow City, Tower A',
    status: OrderStatus.IN_PROGRESS,
    price: 15000,
    assignedVehicleId: 'v1',
    createdAt: '2023-10-25T08:00:00Z',
    deliveryDate: '2023-10-25T14:00:00Z',
  },
  {
    id: 'ord-002',
    customerName: 'Fresh Foods Ltd',
    pickupAddress: 'Food City Market',
    deliveryAddress: 'Azbuka Vkusa, Tverskaya',
    status: OrderStatus.NEW,
    price: 5400,
    assignedVehicleId: undefined,
    createdAt: '2023-10-25T09:30:00Z',
    deliveryDate: '2023-10-26T08:00:00Z',
  },
  {
    id: 'ord-003',
    customerName: 'BuildMaterials Inc',
    pickupAddress: 'Leroy Merlin Warehouse',
    deliveryAddress: 'Private Residence, Rublevka',
    status: OrderStatus.COMPLETED,
    price: 22000,
    assignedVehicleId: 'v2',
    createdAt: '2023-10-24T10:00:00Z',
    deliveryDate: '2023-10-24T16:00:00Z',
  },
];

// Mock Fuel Logs for Analysis
export const MOCK_FUEL_LOGS: FuelLog[] = [
  { id: 'f1', vehicleId: 'v1', date: '2023-10-20', liters: 100, cost: 5500, mileage: 10000, location: 'Lukoil #42' },
  { id: 'f2', vehicleId: 'v1', date: '2023-10-22', liters: 120, cost: 6600, mileage: 10350, location: 'Gazpromneft #11' },
  // Anomaly: v2 consumed way more than expected
  { id: 'f3', vehicleId: 'v2', date: '2023-10-21', liters: 60, cost: 3300, mileage: 5000, location: 'Rosneft #5' },
  { id: 'f4', vehicleId: 'v2', date: '2023-10-23', liters: 70, cost: 3850, mileage: 5100, location: 'Unknown St.' }, 
];

// Mock Maintenance Records
export const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  { 
    id: 'm1', 
    vehicleId: 'v3', 
    date: '2023-10-26', 
    type: 'Oil Change', 
    cost: 15000, 
    status: 'SCHEDULED' 
  },
  { 
    id: 'm2', 
    vehicleId: 'v2', 
    date: '2023-10-28', 
    type: 'Brake Inspection', 
    cost: 5000, 
    status: 'SCHEDULED' 
  },
  { 
    id: 'm3', 
    vehicleId: 'v1', 
    date: '2023-10-15', 
    type: 'Tire Replacement', 
    cost: 45000, 
    status: 'COMPLETED' 
  },
  { 
    id: 'm4', 
    vehicleId: 'v3', 
    date: '2023-11-05', 
    type: 'Annual Inspection', 
    cost: 12000, 
    status: 'SCHEDULED' 
  }
];