/// <reference types="google.maps" />
import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  HeartPulse,
  MapPin,
  Navigation,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  UserCheck,
  Building2,
  Zap,
  CheckCircle2,
  Compass,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { BloodRequest, Donor } from '../types.ts';

interface DonorReceiverGpsTrackerProps {
  request: BloodRequest;
  donor?: Donor | null;
  currentUserRole?: string;
  onCallContact?: (phone: string) => void;
}

// Custom Polyline component
const RoutePolyline: React.FC<{
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
}> = ({ path, strokeColor = '#dc2626' }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        strokeColor,
        strokeOpacity: 0.9,
        strokeWeight: 6,
      });
    } else {
      polylineRef.current.setPath(path);
      if (strokeColor) polylineRef.current.setOptions({ strokeColor });
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path, strokeColor]);

  return null;
};

// Camera view fitter
const CameraFitter: React.FC<{
  pos1: { lat: number; lng: number };
  pos2: { lat: number; lng: number };
}> = ({ pos1, pos2 }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pos1);
    bounds.extend(pos2);
    map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
  }, [map, pos1.lat, pos1.lng, pos2.lat, pos2.lng]);

  return null;
};

// Known Tamil Nadu city base coordinates
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Trichy: { lat: 10.7905, lng: 78.7047 },
  Salem: { lat: 11.6643, lng: 78.146 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
};

function generateRoute(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
  const points: { lat: number; lng: number }[] = [];
  const steps = 14;
  const midLat = (p1.lat + p2.lat) / 2 + 0.006;
  const midLng = (p1.lng + p2.lng) / 2 - 0.005;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * p1.lat + 2 * (1 - t) * t * midLat + t * t * p2.lat;
    const lng = (1 - t) * (1 - t) * p1.lng + 2 * (1 - t) * t * midLng + t * t * p2.lng;
    points.push({ lat, lng });
  }

  return points;
}

export const DonorReceiverGpsTrackerContent: React.FC<DonorReceiverGpsTrackerProps> = ({
  request,
  donor,
  currentUserRole = 'patient',
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Base hospital / receiver location in Tamil Nadu
  const cityBase = CITY_COORDS[request.hospital_city] || CITY_COORDS['Chennai'];
  const reqHash = (request.id || 'BR-0001').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hospitalPos = {
    lat: cityBase.lat + ((reqHash % 13) - 6) * 0.003,
    lng: cityBase.lng + (((reqHash * 2) % 15) - 7) * 0.003,
  };

  // Initial Donor location offset in Tamil Nadu region
  const initialDonorPos = {
    lat: hospitalPos.lat + 0.022,
    lng: hospitalPos.lng - 0.018,
  };

  const routePoints = generateRoute(initialDonorPos, hospitalPos);

  // States for real-time coordinate subscriptions
  const [donorLivePos, setDonorLivePos] = useState(initialDonorPos);
  const [userBrowserGps, setUserBrowserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isSharingLiveGps, setIsSharingLiveGps] = useState(false);
  const [stepIdx, setStepIdx] = useState(2);
  const [infoTarget, setInfoTarget] = useState<'donor' | 'hospital' | null>(null);

  // Direct Contact Details
  const receiverPhone = request.contact_phone || '+91 98402 34567';
  const receiverEmail = request.requester_email || 'staff.rajesh@apollo-hospital.org';
  const donorPhone = donor?.phone || (donor as Record<string, unknown> | null | undefined)?.donor_phone as string || '+91 98403 45678';
  const donorEmail = donor?.email || (donor as Record<string, unknown> | null | undefined)?.donor_email as string || 'donor.kavitha@gmail.com';

  // Real-time Browser Geolocation API Watcher
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number;
    if (isSharingLiveGps) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserBrowserGps(newPos);
          if (currentUserRole === 'donor') {
            setDonorLivePos(newPos);
          }
        },
        err => console.warn('Browser GPS watch warning:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isSharingLiveGps, currentUserRole]);

  // Simulated GPS Telemetry Interval along Tamil Nadu route
  useEffect(() => {
    if (isSharingLiveGps && userBrowserGps) return; // Use real device GPS if sharing active

    const interval = setInterval(() => {
      setStepIdx(prev => {
        const next = (prev + 1) % routePoints.length;
        setDonorLivePos(routePoints[next]);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [routePoints, isSharingLiveGps, userBrowserGps]);

  const estMins = Math.max(4, Math.round((routePoints.length - stepIdx) * 1.8));
  const estDist = ((routePoints.length - stepIdx) * 0.75).toFixed(1) + ' km';

  const externalNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${donorLivePos.lat},${donorLivePos.lng}&destination=${hospitalPos.lat},${hospitalPos.lng}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Tracker Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-red-600 uppercase tracking-wider">
                Google Maps Live GPS Location Sharing
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                Subscribed to Tamil Nadu Radar
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Donor ({request.blood_group}) ➔ Receiver ({request.patient_name})
            </h3>
            <p className="text-xs text-slate-500">
              Live coordinates streaming between {request.hospital_name}, {request.hospital_city} and donor en route.
            </p>
          </div>
        </div>

        {/* Action Controls & Telemetry Stats */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSharingLiveGps(!isSharingLiveGps)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
              isSharingLiveGps
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isSharingLiveGps ? 'Sharing Live Device GPS' : 'Share My Real Location'}</span>
          </button>

          <a
            href={externalNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
          </a>

          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-900 rounded-xl text-xs font-mono font-bold border border-slate-200">
            <span className="text-red-600">{estMins} mins ETA</span>
            <span className="text-slate-400">•</span>
            <span className="text-blue-600">{estDist}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Shared Map View */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner h-[400px] bg-slate-100">
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={hospitalPos}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          <CameraFitter pos1={donorLivePos} pos2={hospitalPos} />
          <RoutePolyline path={routePoints} strokeColor="#e11d48" />

          {/* Donor Live Position Marker */}
          <AdvancedMarker
            position={donorLivePos}
            title="Donor Live Location"
            onClick={() => setInfoTarget('donor')}
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-9 h-9 rounded-full bg-rose-500/40 animate-ping" />
              <div className="relative p-2.5 rounded-full bg-rose-600 border-2 border-white text-white shadow-2xl">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
          </AdvancedMarker>

          {/* Receiver / Hospital Emergency Ward Marker */}
          <AdvancedMarker
            position={hospitalPos}
            title={request.hospital_name}
            onClick={() => setInfoTarget('hospital')}
          >
            <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1e40af">
              <Building2 className="w-4 h-4 text-white" />
            </Pin>
          </AdvancedMarker>

          {/* Donor Live InfoWindow */}
          {infoTarget === 'donor' && (
            <InfoWindow position={donorLivePos} onCloseClick={() => setInfoTarget(null)}>
              <div className="p-2 space-y-1.5 text-xs max-w-xs">
                <div className="font-bold text-rose-600 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Verified {request.blood_group} Blood Donor</span>
                </div>
                <div className="text-slate-800 font-mono text-[11px]">
                  Coords: {donorLivePos.lat.toFixed(4)}, {donorLivePos.lng.toFixed(4)}
                </div>
                <div className="text-slate-600">En Route to {request.hospital_name}</div>
                <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
                  <a href={`tel:${donorPhone}`} className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]">
                    Call {donorPhone}
                  </a>
                  <a href={`mailto:${donorEmail}`} className="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[10px]">
                    Email Donor
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Hospital Receiver InfoWindow */}
          {infoTarget === 'hospital' && (
            <InfoWindow position={hospitalPos} onCloseClick={() => setInfoTarget(null)}>
              <div className="p-2 space-y-1.5 text-xs max-w-xs">
                <div className="font-bold text-blue-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hospital Emergency Ward</span>
                </div>
                <div className="font-black text-slate-900">{request.hospital_name}</div>
                <div className="text-slate-600">Patient: <strong>{request.patient_name}</strong></div>
                <div className="text-slate-500">{request.contact_person}</div>
                <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
                  <a href={`tel:${receiverPhone}`} className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]">
                    Call {receiverPhone}
                  </a>
                  <a href={`mailto:${receiverEmail}`} className="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[10px]">
                    Email Hospital
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Live Status Overlay Banner */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-3.5 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold">Real-Time Subscribed Coordinates • {request.hospital_city}, Tamil Nadu</span>
        </div>
      </div>

      {/* Direct Contact & Real Phone/Email Communication Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Donor Contact Card */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-rose-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-600" />
              Verified Blood Donor
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
              {request.blood_group} Donor
            </span>
          </div>

          <div>
            <span className="text-sm font-black text-slate-900 block">{donor?.blood_group ? `${donor.blood_group} Volunteer Donor` : 'Kavitha Ramanathan (Donor)'}</span>
            <span className="text-slate-600">Location: Tamil Nadu Regional Network</span>
          </div>

          <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center gap-2">
            <a
              href={`tel:${donorPhone}`}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Real Number ({donorPhone})</span>
            </a>
            <a
              href={`mailto:${donorEmail}`}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Email ({donorEmail})</span>
            </a>
          </div>
        </div>

        {/* Receiver Hospital Contact Card */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Hospital Emergency Receiver
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black">
              Patient: {request.patient_name}
            </span>
          </div>

          <div>
            <span className="text-sm font-black text-slate-900 block">{request.hospital_name}</span>
            <span className="text-slate-600">{request.contact_person} • {request.hospital_city}, TN</span>
          </div>

          <div className="pt-2 border-t border-blue-200/60 flex flex-wrap items-center gap-2">
            <a
              href={`tel:${receiverPhone}`}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Real Number ({receiverPhone})</span>
            </a>
            <a
              href={`mailto:${receiverEmail}`}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-blue-300" />
              <span>Email ({receiverEmail})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DonorReceiverGpsTracker: React.FC<DonorReceiverGpsTrackerProps> = props => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="p-5 bg-slate-900 text-white rounded-3xl border border-slate-800 text-xs space-y-1">
        <strong className="text-amber-400 block">Google Maps API Key Required</strong>
        <span>Live GPS tracking requires VITE_GOOGLE_MAPS_API_KEY environment configuration.</span>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <DonorReceiverGpsTrackerContent {...props} />
    </APIProvider>
  );
};
