import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Truck,
  MapPin,
  Clock,
  Thermometer,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Navigation2,
  Building2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AdmissionRecord } from '../types.ts';

interface D3PharmacyDeliveryMapProps {
  admission?: AdmissionRecord;
  className?: string;
  onNavigateOrder?: (orderId: string) => void;
}

interface Waypoint {
  id: string;
  name: string;
  category: 'depot' | 'checkpoint' | 'gate' | 'destination';
  x: number;
  y: number;
  timeEstimate: string;
  description: string;
  status: 'passed' | 'current' | 'upcoming';
  tempCelsius: number;
}

export const D3PharmacyDeliveryMap: React.FC<D3PharmacyDeliveryMapProps> = ({
  admission,
  className = '',
  onNavigateOrder,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Real-time animation progression (0 to 100%)
  const [progress, setProgress] = useState<number>(() => {
    if (admission?.status === 'Discharged / Recovered') return 100;
    return 62; // Default active in-transit
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<Waypoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hospital & Courier details
  const hospitalName = admission?.hospital_name || 'Apollo Hospitals Main - Greams Road';
  const wardNumber = admission?.ward_number || 'Cardiothoracic Intensive Care';
  const bedNumber = admission?.bed_number || 'Bed CS-12';
  const patientName = admission?.patient_name || 'Thirunavukkarasu V.';
  const orderId = admission?.order_id || 'ORD-2026-0004';
  const courierName = admission?.courier?.full_name || 'Murugan Perumal';
  const courierPhone = admission?.courier?.phone || '+91 98404 12345';

  // Base waypoint definitions across map coordinate space (800 x 420 viewBox)
  const waypoints: Waypoint[] = useMemo(() => {
    return [
      {
        id: 'wp-1',
        name: 'Central Pharmacy Vault & Depot',
        category: 'depot',
        x: 80,
        y: 330,
        timeEstimate: 'Dispatched 14m ago',
        description: 'Cold-chain insulated container sealed and verified by Pharmacist.',
        status: progress >= 20 ? 'passed' : 'current',
        tempCelsius: 3.4,
      },
      {
        id: 'wp-2',
        name: 'Anna Salai Arterial Flyover',
        category: 'checkpoint',
        x: 280,
        y: 240,
        timeEstimate: 'Checkpoint Cleared 6m ago',
        description: 'Priority medical green transit corridor clearance verified.',
        status: progress >= 50 ? 'passed' : progress >= 20 ? 'current' : 'upcoming',
        tempCelsius: 3.7,
      },
      {
        id: 'wp-3',
        name: 'Hospital South Campus Gate',
        category: 'gate',
        x: 520,
        y: 160,
        timeEstimate: 'ETA: In ~4 mins',
        description: 'Security & bio-sanitization barcode inspection station.',
        status: progress >= 85 ? 'passed' : progress >= 50 ? 'current' : 'upcoming',
        tempCelsius: 3.8,
      },
      {
        id: 'wp-4',
        name: `${wardNumber} (${bedNumber})`,
        category: 'destination',
        x: 720,
        y: 80,
        timeEstimate: 'ETA: In ~8 mins',
        description: `Direct bedside delivery to Patient ${patientName}.`,
        status: progress >= 100 ? 'passed' : 'upcoming',
        tempCelsius: 3.9,
      },
    ];
  }, [progress, wardNumber, bedNumber, patientName]);

  // Derived telemetry
  const distanceKm = Math.max(0, ((100 - progress) / 100) * 5.8).toFixed(1);
  const etaMins = Math.max(1, Math.round(((100 - progress) / 100) * 16));
  const currentSpeed = isPlaying ? (progress >= 100 ? 0 : 38 + Math.round(Math.sin(progress) * 6)) : 0;
  const currentTemp = (3.4 + (progress / 100) * 0.5).toFixed(1);

  // Animation ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 100;
        }
        return Math.min(100, prev + 0.35 * speedMultiplier);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  // D3 Visualization Render
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 420;

    // Define Gradients and Defs
    const defs = svg.append('defs');

    // Route Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'neon-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Route Gradient (Cyan to Emerald to Violet)
    const routeGradient = defs.append('linearGradient')
      .attr('id', 'route-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    routeGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6');

    routeGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#06b6d4');

    routeGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981');

    // Base background grid
    const gridGroup = svg.append('g').attr('class', 'city-grid').attr('opacity', '0.12');
    for (let x = 0; x <= width; x += 40) {
      gridGroup.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', height)
        .attr('stroke', '#64748b')
        .attr('stroke-width', '1');
    }
    for (let y = 0; y <= height; y += 40) {
      gridGroup.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y)
        .attr('stroke', '#64748b')
        .attr('stroke-width', '1');
    }

    // Stylized Medical District River / Urban Corridor Arc
    const riverGenerator = d3.line<{ x: number; y: number }>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);

    const riverPoints = [
      { x: 0, y: 190 },
      { x: 220, y: 170 },
      { x: 420, y: 260 },
      { x: 650, y: 290 },
      { x: 800, y: 340 },
    ];

    svg.append('path')
      .attr('d', riverGenerator(riverPoints))
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', '28')
      .attr('stroke-linecap', 'round')
      .attr('opacity', '0.5');

    // Urban District Labels
    const districts = [
      { name: 'CENTRAL HEALTH DEPOT ZONE', x: 70, y: 390 },
      { name: 'ANNA SALAI EXPRESS ARTERY', x: 270, y: 310 },
      { name: 'MEDICAL ENCLAVE SOUTH', x: 500, y: 220 },
      { name: 'APOLLO / INPATIENT PAVILION', x: 610, y: 40 },
    ];

    districts.forEach(d => {
      svg.append('text')
        .attr('x', d.x)
        .attr('y', d.y)
        .attr('fill', '#475569')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.12em')
        .text(d.name);
    });

    // Transit Route Path geometry (CatmullRom spline through waypoints)
    const lineGenerator = d3.line<Waypoint>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCatmullRom.alpha(0.6));

    const pathData = lineGenerator(waypoints);
    if (!pathData) return;

    // Outer Background Track
    svg.append('path')
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', '#334155')
      .attr('stroke-width', '8')
      .attr('stroke-linecap', 'round')
      .attr('opacity', '0.8');

    // Glowing Active Neon Path
    const activeRoutePath = svg.append('path')
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#route-gradient)')
      .attr('stroke-width', '4')
      .attr('stroke-linecap', 'round')
      .attr('filter', 'url(#neon-glow)');

    // Animated dashed vector pulse line
    svg.append('path')
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', '2')
      .attr('stroke-dasharray', '8,12')
      .attr('stroke-linecap', 'round')
      .attr('opacity', '0.7')
      .append('animate')
      .attr('attributeName', 'stroke-dashoffset')
      .attr('from', '40')
      .attr('to', '0')
      .attr('dur', '1.2s')
      .attr('repeatCount', 'indefinite');

    // Calculate courier marker position along path using path.getPointAtLength
    const pathNode = activeRoutePath.node() as SVGPathElement;
    if (pathNode) {
      const totalLength = pathNode.getTotalLength();
      const currentPoint = pathNode.getPointAtLength((progress / 100) * totalLength);

      // Traveled segment path (solid bright line)
      const traveledPath = svg.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', '4')
        .attr('stroke-dasharray', `${(progress / 100) * totalLength} ${totalLength}`)
        .attr('stroke-linecap', 'round');

      // Courier Marker Group
      const courierGroup = svg.append('g')
        .attr('transform', `translate(${currentPoint.x}, ${currentPoint.y})`)
        .attr('class', 'courier-marker');

      // Pulsing Radar Rings
      if (isPlaying && progress < 100) {
        courierGroup.append('circle')
          .attr('r', 18)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2)
          .attr('opacity', 0.8)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '14;34')
          .attr('dur', '1.8s')
          .attr('repeatCount', 'indefinite');

        courierGroup.append('circle')
          .attr('r', 18)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.8)
          .append('animate')
          .attr('attributeName', 'opacity')
          .attr('values', '0.8;0')
          .attr('dur', '1.8s')
          .attr('repeatCount', 'indefinite');
      }

      // Courier Central Badge
      courierGroup.append('circle')
        .attr('r', 16)
        .attr('fill', '#0284c7')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 3)
        .attr('filter', 'url(#neon-glow)');

      // Courier Van Icon (SVG path inside circle)
      courierGroup.append('path')
        .attr('d', 'M-7,-3 h9 l3,3 h3 v5 h-2 a2.5,2.5 0 0,1 -5,0 h-3 a2.5,2.5 0 0,1 -5,0 h-2 v-8 h2 z')
        .attr('fill', '#ffffff')
        .attr('transform', 'scale(0.85) translate(0, -1)');

      // Live Telemetry Floating Pill above courier
      const badgeGroup = courierGroup.append('g')
        .attr('transform', 'translate(0, -28)');

      badgeGroup.append('rect')
        .attr('x', -60)
        .attr('y', -14)
        .attr('width', 120)
        .attr('height', 20)
        .attr('rx', 10)
        .attr('fill', '#0f172a')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.5);

      badgeGroup.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('dominant-baseline', 'middle')
        .text(progress >= 100 ? 'Delivered at Ward' : `${currentSpeed} km/h • ${currentTemp}°C`);
    }

    // Render Waypoints with interactive nodes & tooltips
    waypoints.forEach((wp, idx) => {
      const isDestination = wp.category === 'destination';
      const isDepot = wp.category === 'depot';

      const wpGroup = svg.append('g')
        .attr('transform', `translate(${wp.x}, ${wp.y})`)
        .attr('class', 'waypoint-node')
        .style('cursor', 'pointer')
        .on('mouseenter', (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
          setActiveTooltip(wp);
        })
        .on('mouseleave', () => {
          setActiveTooltip(null);
        });

      // Outer pulse halo for destination
      if (isDestination) {
        wpGroup.append('circle')
          .attr('r', 16)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 2)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '12;24')
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');
      }

      // Base Circle
      wpGroup.append('circle')
        .attr('r', isDestination || isDepot ? 13 : 9)
        .attr('fill', wp.status === 'passed' ? '#10b981' : wp.status === 'current' ? '#0ea5e9' : '#1e293b')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', isDestination || isDepot ? 2.5 : 2);

      // Icon / Number
      wpGroup.append('text')
        .attr('x', 0)
        .attr('y', 0.5)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', isDestination || isDepot ? '9px' : '8px')
        .attr('font-weight', '900')
        .text(isDepot ? 'H' : isDestination ? 'Rx' : String(idx + 1));

      // Label below or above waypoint
      const labelY = wp.y > 200 ? wp.y + 24 : wp.y - 18;
      const labelGroup = svg.append('g')
        .attr('transform', `translate(${wp.x}, ${labelY})`)
        .style('pointer-events', 'none');

      labelGroup.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('fill', wp.status === 'passed' ? '#94a3b8' : '#e2e8f0')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(wp.name);

      labelGroup.append('text')
        .attr('x', 0)
        .attr('y', 13)
        .attr('text-anchor', 'middle')
        .attr('fill', '#0284c7')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .text(wp.timeEstimate);
    });
  }, [waypoints, progress, isPlaying, currentSpeed, currentTemp]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Top Header & Telemetry Bar */}
      <div className="p-4 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 text-[10px] font-black uppercase tracking-wider">
              D3 Visual Delivery Radar
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-300">
              Chennai Central Pharmacy Transit Lane
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <span>Prescription Order {orderId}</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
              {progress >= 100 ? 'Delivered' : 'Active Cold-Chain Transit'}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-0.5">
            Destination: <strong className="text-slate-200">{hospitalName}</strong> • {wardNumber} ({bedNumber})
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Arrival</span>
            <span className="text-base font-black text-blue-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{progress >= 100 ? 'At Bedside' : `${etaMins} mins (${distanceKm} km)`}</span>
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Cold-Chain Temp</span>
            <span className="text-base font-black text-emerald-400 flex items-center gap-1">
              <Thermometer className="w-4 h-4" />
              <span>{currentTemp}°C</span>
              <span className="text-[10px] text-emerald-300 font-semibold">(Safe)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary D3 Canvas Container */}
      <div className="relative w-full overflow-hidden p-2 sm:p-4 bg-radial from-slate-900 via-slate-950 to-black">
        <svg
          ref={svgRef}
          viewBox="0 0 800 420"
          className="w-full h-auto max-h-[460px] select-none block drop-shadow-xl"
        />

        {/* Floating Interactive Tooltip */}
        {activeTooltip && (
          <div
            className="absolute z-30 pointer-events-none p-3 rounded-xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl text-xs max-w-xs transform -translate-x-1/2 -translate-y-full mb-3 backdrop-blur-md"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div className="font-bold text-white flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
              <span>{activeTooltip.name}</span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {activeTooltip.tempCelsius}°C
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {activeTooltip.description}
            </p>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{activeTooltip.timeEstimate}</span>
              <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {activeTooltip.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Scrub Slider */}
      <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Playback Controls & Progress Bar */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-600/30 shrink-0"
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shrink-0"
            title="Reset to Depot"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Interactive Scrub Slider */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Depot Vault (0%)</span>
              <span className="text-cyan-400 font-mono">{Math.round(progress)}% In-Transit</span>
              <span>Inpatient Bedside (100%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={() => setSpeedMultiplier(prev => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold border border-slate-700 transition shrink-0"
            title="Simulation Speed Multiplier"
          >
            {speedMultiplier}x
          </button>
        </div>

        {/* Courier Personnel Contact Card */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Courier Partner</div>
            <div className="font-bold text-white">{courierName}</div>
          </div>
          <a
            href={`tel:${courierPhone.replace(/\s+/g, '')}`}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Navigation2 className="w-3.5 h-3.5" />
            <span>Call Fleet</span>
          </a>

          {onNavigateOrder && (
            <button
              type="button"
              onClick={() => onNavigateOrder(orderId)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700"
            >
              Order Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
