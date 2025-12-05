import { Vehicle, Coordinates } from '../types';
import { MOCK_VEHICLES } from '../constants';

// Simple physics simulation for demo purposes
// Moves vehicles slightly in random directions to simulate live tracking
export const simulateMovement = (vehicles: Vehicle[]): Vehicle[] => {
  return vehicles.map((v) => {
    if (v.status === 'MAINTENANCE' || v.status === 'IDLE') return v;

    // Simulate movement
    const moveLat = (Math.random() - 0.5) * 0.001;
    const moveLng = (Math.random() - 0.5) * 0.001;

    // Decrease fuel slightly
    const fuelConsumption = 0.05; 
    let newFuel = v.fuelLevel - fuelConsumption;
    if (newFuel < 0) newFuel = 0;

    return {
      ...v,
      currentLocation: {
        lat: v.currentLocation.lat + moveLat,
        lng: v.currentLocation.lng + moveLng,
      },
      fuelLevel: newFuel,
    };
  });
};

// Calculate distance between two points (Haversine formula simplified)
export const calculateDistanceKm = (c1: Coordinates, c2: Coordinates): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(c2.lat - c1.lat);
  const dLng = deg2rad(c2.lng - c1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(c1.lat)) *
      Math.cos(deg2rad(c2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
