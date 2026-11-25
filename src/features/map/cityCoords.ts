// Approximate centroids for NCR cities, for placing markers on the native map.
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Manila: { lat: 14.5995, lng: 120.9842 },
  'Quezon City': { lat: 14.676, lng: 121.0437 },
  Makati: { lat: 14.5547, lng: 121.0244 },
  Taguig: { lat: 14.5176, lng: 121.0509 },
  Pasig: { lat: 14.5764, lng: 121.0851 },
  Caloocan: { lat: 14.6488, lng: 120.983 },
  Parañaque: { lat: 14.4793, lng: 121.0198 },
  Pasay: { lat: 14.5378, lng: 121.0014 },
  Mandaluyong: { lat: 14.5794, lng: 121.0359 },
  Marikina: { lat: 14.6507, lng: 121.1029 },
  Muntinlupa: { lat: 14.3832, lng: 121.0409 },
  'Las Piñas': { lat: 14.4499, lng: 120.983 },
  Valenzuela: { lat: 14.7, lng: 120.983 },
  Malabon: { lat: 14.6625, lng: 120.9567 },
  Navotas: { lat: 14.6667, lng: 120.9417 },
  'San Juan': { lat: 14.6019, lng: 121.0355 },
  Pateros: { lat: 14.5417, lng: 121.0668 },
};

export const NCR_REGION = {
  latitude: 14.56,
  longitude: 121.01,
  latitudeDelta: 0.4,
  longitudeDelta: 0.34,
};
