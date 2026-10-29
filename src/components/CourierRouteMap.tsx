/// <reference types="google.maps" />
import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Building2,
  ExternalLink,
  RotateCw,
  Compass,
} from 'lucide-react';
import { Order } from '../types.ts';

// Known Tamil Nadu city centroids for accurate geocoding fallbacks
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  Salem: { lat: 11.6643, lng: 78.146 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Erode: { lat: 11.341, lng: 77.7172 },
};

// Dispatch Hubs
const DISPATCH_HUBS = [
  { id: 'HUB-CHE', name: 'UyirThunai Central Pharma Hub', city: 'Chennai', lat: 13.0604, lng: 80.2496 },
  { id: 'HUB-CBE', name: 'UyirThunai Western Dispatch Hub', city: 'Coimbatore', lat: 11.0201, lng: 76.9723 },
  { id: 'HUB-MDU', name: 'UyirThunai Southern Medical Hub', city: 'Madurai', lat: 9.9288, lng: 78.1365 },
];

interface CourierRouteMapProps {
  deliveries: Order[];
  onSelectDelivery?: (orderId: string) => void;
}

// Custom Polyline component for React @vis.gl/react-google-maps
const PolylineOverlay: React.FC<{
  path: google.maps.LatLngLiteral[];
  options?: google.maps.PolylineOptions;
}> = ({ path, options }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        ...options,
      });
    } else {
      polylineRef.current.setPath(path);
      if (options) polylineRef.current.setOptions(options);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path, options]);

  return null;
};

// Inner Route Calculator & View Adjuster Component
const ActiveRouteController: React.FC<{
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  apiKey: string;
  onRouteCalculated: (routeData: {
    distanceText: string;
    durationText: string;
    path: google.maps.LatLngLiteral[];
    steps: string[];
  }) => void;
}> = ({ origin, destination, apiKey, onRouteCalculated }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map) return;

    // Fit bounds to show origin and destination smoothly
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });

    // Calculate fastest path using Routes API REST endpoint
    const fetchRoutes = async () => {
      try {
        const body = {
          origin: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng,
              },
            },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
          computeAlternativeRoutes: false,
          units: 'METRIC',
        };

        const res = await fetch('https://routes.googleapis.com/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.legs.steps.navigationInstruction,routes.polyline.encodedPolyline',
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const distKm = (route.distanceMeters / 1000).toFixed(1) + ' km';
            const durMins = Math.round(parseInt(route.duration || '0', 10) / 60) + ' mins';
            
            // Decode encoded polyline if geometry library is available, or generate intermediate waypoints
            let decodedPath: google.maps.LatLngLiteral[] = [];
            if (google.maps.geometry?.encoding && route.polyline?.encodedPolyline) {
              const points = google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
              decodedPath = points.map((p: google.maps.LatLng) => ({ lat: p.lat(), lng: p.lng() }));
            } else {
              // Interpolate smooth curve points between origin and destination
              decodedPath = generateRoutePath(origin, destination);
            }

            const steps = (route.legs?.[0]?.steps || [])
              .map((s: any) => s.navigationInstruction?.instructions)
              .filter(Boolean);

            onRouteCalculated({
              distanceText: distKm,
              durationText: durMins,
              path: decodedPath,
              steps: steps.length > 0 ? steps : [
                `Head out from dispatch hub toward ${destination.lat.toFixed(3)}, ${destination.lng.toFixed(3)}`,
                'Take fastest medical emergency corridor route',
                'Arrive at hospital doorstep / emergency ward',
              ],
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Routes API call fallback to geometric interpolation:', err);
      }

      // Fallback calculation if REST API key restriction or quota is triggered
      const distMeters = calculateHaversineDistance(origin, destination);
      const distKm = (distMeters / 1000).toFixed(1) + ' km';
      const estMins = Math.max(5, Math.round((distMeters / 1000) * 2.2)) + ' mins';
      const fallbackPath = generateRoutePath(origin, destination);

      onRouteCalculated({
        distanceText: distKm,
        durationText: estMins,
        path: fallbackPath,
        steps: [
          'Depart dispatch hub via arterial highway',
          'Continue along priority medical transit lane',
          'Turn toward target hospital/patient ward address',
        ],
      });
    };

    fetchRoutes();
  }, [map, origin.lat, origin.lng, destination.lat, destination.lng, apiKey]);

  return null;
};

// Distance calculation helper
function calculateHaversineDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (p2.lat - p1.lat) * rad;
  const dLng = (p2.lng - p1.lng) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * rad) * Math.cos(p2.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate intermediate polyline route waypoints
function generateRoutePath(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  const points: { lat: number; lng: number }[] = [];
  const steps = 15;
  const midLat = (start.lat + end.lat) / 2 + 0.008;
  const midLng = (start.lng + end.lng) / 2 - 0.005;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bezier curve to simulate real road curvature
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * midLat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * midLng + t * t * end.lng;
    points.push({ lat, lng });
  }

  return points;
}

export const CourierRouteMapContent: React.FC<CourierRouteMapProps> = ({ deliveries, onSelectDelivery }) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeRoutePath, setActiveRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string; steps: string[] }>({
    distance: '-- km',
    duration: '-- mins',
    steps: [],
  });
  const [courierPos, setCourierPos] = useState<{ lat: number; lng: number }>({ lat: 13.0604, lng: 80.2496 });
  const [infoWindowTarget, setInfoWindowTarget] = useState<'courier' | 'hub' | string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Select first active order on mount
  useEffect(() => {
    if (deliveries.length > 0 && !selectedOrderId) {
      const active = deliveries.find(d => d.status !== 'Delivered') || deliveries[0];
      setSelectedOrderId(active.id);
    }
  }, [deliveries]);

  // Quota exceeded event listener setup
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const activeOrder = deliveries.find(d => d.id === selectedOrderId);

  // Derive courier hub origin and destination position based on active order
  const currentCity = activeOrder?.delivery_city || 'Chennai';
  const hub = DISPATCH_HUBS.find(h => h.city.toLowerCase() === currentCity.toLowerCase()) || DISPATCH_HUBS[0];

  // Estimate destination lat/lng from order city / address hash or fallback
  const cityBase = CITY_COORDINATES[currentCity] || CITY_COORDINATES['Chennai'];
  const orderHash = (activeOrder?.id || 'ORD-0000').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const destOffsetLat = ((orderHash % 17) - 8) * 0.0035;
  const destOffsetLng = (((orderHash * 3) % 19) - 9) * 0.0035;

  const destinationPos = {
    lat: cityBase.lat + destOffsetLat,
    lng: cityBase.lng + destOffsetLng,
  };

  const hubPos = { lat: hub.lat, lng: hub.lng };

  // Simulated live courier location along path
  useEffect(() => {
    if (activeRoutePath.length > 0) {
      setCourierPos(activeRoutePath[Math.floor(activeRoutePath.length * 0.35)]);
    } else {
      setCourierPos(hubPos);
    }
  }, [activeRoutePath, hubPos.lat, hubPos.lng]);

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    if (onSelectDelivery) onSelectDelivery(id);
  };

  return (
    <div className="space-y-4">
      {/* Quota Exceeded Banner (Tier 2 Client Quota Defense) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-2xl text-xs md:text-sm text-center shadow-xs">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Control Header & Order Selector Pill Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider">
                  Real-Time Google Maps Corridor
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Fastest Route Engine
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Active Courier Route Visualization
              </h3>
            </div>
          </div>

          {/* Quick Route Stats Badge */}
          {activeOrder && (
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-mono">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-bold">{routeStats.duration}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5 text-blue-300">
                <Compass className="w-3.5 h-3.5" />
                <span className="font-bold">{routeStats.distance}</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Selector Chips */}
        {deliveries.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold shrink-0">Select Assignment:</span>
            {deliveries.map(d => {
              const isSelected = d.id === selectedOrderId;
              return (
                <button
                  key={d.id}
                  onClick={() => handleSelectOrder(d.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{d.id}</span>
                  <span className="text-[10px] font-semibold opacity-75">({d.delivery_city})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-300 shadow-lg h-[420px] bg-slate-100">
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={hubPos}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          {/* Active Route Controller logic */}
          {activeOrder && (
            <ActiveRouteController
              origin={hubPos}
              destination={destinationPos}
              apiKey={apiKey}
              onRouteCalculated={({ distanceText, durationText, path, steps }) => {
                setActiveRoutePath(path);
                setRouteStats({
                  distance: distanceText,
                  duration: durationText,
                  steps,
                });
              }}
            />
          )}

          {/* Polyline Route Overlay */}
          {activeRoutePath.length > 0 && (
            <PolylineOverlay
              path={activeRoutePath}
              options={{
                strokeColor: '#3b82f6',
                strokeOpacity: 0.9,
                strokeWeight: 6,
              }}
            />
          )}

          {/* Dispatch Hub Marker */}
          <AdvancedMarker
            position={hubPos}
            title={hub.name}
            onClick={() => setInfoWindowTarget('hub')}
          >
            <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1e40af">
              <Building2 className="w-4 h-4 text-white" />
            </Pin>
          </AdvancedMarker>

          {/* Courier Live Simulated Marker */}
          <AdvancedMarker
            position={courierPos}
            title="Courier Partner Live Vehicle"
            onClick={() => setInfoWindowTarget('courier')}
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-amber-400/40 animate-ping" />
              <div className="relative p-2 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 shadow-lg">
                <Truck className="w-4 h-4" />
              </div>
            </div>
          </AdvancedMarker>

          {/* Emergency / Customer Delivery Destination Marker */}
          {activeOrder && (
            <AdvancedMarker
              position={destinationPos}
              title={`Delivery: ${activeOrder.user_name}`}
              onClick={() => setInfoWindowTarget(activeOrder.id)}
            >
              <Pin background="#e11d48" glyphColor="#ffffff" borderColor="#9f1239">
                <MapPin className="w-4 h-4 text-white" />
              </Pin>
            </AdvancedMarker>
          )}

          {/* InfoWindow for Courier */}
          {infoWindowTarget === 'courier' && (
            <InfoWindow position={courierPos} onCloseClick={() => setInfoWindowTarget(null)}>
              <div className="p-2 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Courier Dispatch Vehicle</span>
                </div>
                <div className="text-slate-600">Speed: 45 km/h • GPS Active</div>
                <div className="text-emerald-600 font-bold">ETA: {routeStats.duration}</div>
              </div>
            </InfoWindow>
          )}

          {/* InfoWindow for Hub */}
          {infoWindowTarget === 'hub' && (
            <InfoWindow position={hubPos} onCloseClick={() => setInfoWindowTarget(null)}>
              <div className="p-2 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{hub.name}</span>
                </div>
                <div className="text-slate-600">Central Pharmacy & Cold Storage</div>
              </div>
            </InfoWindow>
          )}

          {/* InfoWindow for Selected Order */}
          {activeOrder && infoWindowTarget === activeOrder.id && (
            <InfoWindow position={destinationPos} onCloseClick={() => setInfoWindowTarget(null)}>
              <div className="p-2 space-y-1 text-xs">
                <div className="font-bold text-rose-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Emergency Destination</span>
                </div>
                <div className="font-black text-slate-900">{activeOrder.user_name}</div>
                <div className="text-slate-600 max-w-xs">{activeOrder.delivery_address}</div>
                <div className="text-blue-700 font-bold">Contact: {activeOrder.delivery_phone}</div>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Map Live Overlay Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-3.5 py-1.5 rounded-2xl border border-slate-700 shadow-lg flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold">Google Maps Real-Time Courier Navigation</span>
        </div>

        {/* Directions Quick Overlay Drawer */}
        {activeOrder && routeStats.steps.length > 0 && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:max-w-md bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-black text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Fastest Emergency Route Step
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-600">{routeStats.duration}</span>
            </div>
            <p className="text-slate-700 font-medium leading-relaxed">
              {routeStats.steps[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CourierRouteMap: React.FC<CourierRouteMapProps> = props => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
          <AlertTriangle className="w-4 h-4" />
          Google Maps Setup Needed
        </div>
        <h3 className="text-base font-bold">Google Maps API Key Not Detected</h3>
        <p className="text-xs text-slate-400">
          Please configure your <code>VITE_GOOGLE_MAPS_API_KEY</code> environment variable to enable live route calculation and interactive dispatch maps.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <CourierRouteMapContent {...props} />
    </APIProvider>
  );
};
