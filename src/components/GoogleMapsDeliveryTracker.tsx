import React, { useState } from 'react';
import { MapPin, Navigation, Truck, Building2, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { AdmissionRecord } from '../types.ts';

interface GoogleMapsDeliveryTrackerProps {
  admission?: AdmissionRecord;
  className?: string;
}

export const GoogleMapsDeliveryTracker: React.FC<GoogleMapsDeliveryTrackerProps> = ({
  admission,
  className = '',
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  const hospitalName = admission?.hospital_name || 'Apollo Hospitals Main - Greams Road';
  const hospitalCity = admission?.hospital_city || 'Chennai';
  const wardNumber = admission?.ward_number || 'Cardiothoracic Intensive Care';
  const bedNumber = admission?.bed_number || 'Bed CS-12';
  const patientName = admission?.patient_name || 'Thirunavukkarasu V.';
  const orderId = admission?.order_id || 'ORD-2026-0004';
  const courierName = admission?.courier?.full_name || 'Murugan Perumal';
  const courierPhone = admission?.courier?.phone || '+91 98404 12345';
  const telemetry = admission?.gps_telemetry;

  // Google Maps embed URL for hospital delivery corridor
  const encodedQuery = encodeURIComponent(`${hospitalName}, ${hospitalCity}, Tamil Nadu`);
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=${mapType === 'satellite' ? 'k' : 'm'}&z=15&output=embed`;

  const externalDirectionsUrl = telemetry
    ? `https://www.google.com/maps/dir/?api=1&origin=${telemetry.origin.lat},${telemetry.origin.lng}&destination=${telemetry.destination.lat},${telemetry.destination.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  return (
    <div className={`rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Google Maps Delivery Tracking
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Secure Corridor
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {patientName} — {hospitalName}
            </h3>
            <p className="text-xs text-slate-500">
              Ward: <strong>{wardNumber}</strong> • {bedNumber} • Order: <strong>{orderId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`px-3 py-1 rounded-lg transition ${mapType === 'roadmap' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1 rounded-lg transition ${mapType === 'satellite' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
            >
              Satellite
            </button>
          </div>

          <a
            href={externalDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-red-400" />
          </a>
        </div>
      </div>

      {/* Telemetry info row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block">Courier Speed</span>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {telemetry?.vehicle_speed_kmh ?? 42} <span className="text-xs font-normal text-slate-500">km/h</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block">Estimated Arrival</span>
          <div className="text-base font-black text-blue-600 mt-0.5">
            {telemetry?.eta_minutes ?? 14} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block">Cold-Chain Sensor</span>
          <div className="text-base font-black text-emerald-600 mt-0.5">
            {telemetry?.temp_celsius ?? 3.8}°C <span className="text-xs font-normal text-slate-500">(Safe)</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block">Delivery Courier</span>
          <div className="text-sm font-black text-slate-900 truncate mt-0.5">
            {courierName}
          </div>
        </div>
      </div>

      {/* Embedded Google Map Iframe */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner h-80 sm:h-96 bg-slate-100">
        <iframe
          title="Google Maps Delivery Tracking"
          src={googleMapsEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Google Maps Integration • Connected to Fleet GPS</span>
        </div>
      </div>
    </div>
  );
};
