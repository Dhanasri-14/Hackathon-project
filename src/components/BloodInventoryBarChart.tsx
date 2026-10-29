import React, { useState } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Users,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Filter,
  Info,
} from 'lucide-react';
import { BloodInventoryLevel } from '../types.ts';
import { useI18n } from '../i18n.tsx';

interface BloodInventoryBarChartProps {
  levels?: BloodInventoryLevel[];
  onNavigate: (page: string) => void;
}

export const BloodInventoryBarChart: React.FC<BloodInventoryBarChartProps> = ({
  levels = [],
  onNavigate,
}) => {
  const { t } = useI18n();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'units' | 'percentage'>('units');

  // Fallback defaults if inventoryLevels hasn't finished loading
  const defaultLevels: BloodInventoryLevel[] = [
    { blood_group: 'O+', units_in_stock: 42, target_capacity: 50, critical_threshold: 12, donor_count: 5, available_donors: 4, active_requests: 1, percentage: 84, status: 'optimal' },
    { blood_group: 'O-', units_in_stock: 9, target_capacity: 35, critical_threshold: 10, donor_count: 4, available_donors: 3, active_requests: 2, percentage: 25, status: 'critical' },
    { blood_group: 'A+', units_in_stock: 36, target_capacity: 45, critical_threshold: 10, donor_count: 4, available_donors: 3, active_requests: 1, percentage: 80, status: 'optimal' },
    { blood_group: 'A-', units_in_stock: 14, target_capacity: 25, critical_threshold: 8, donor_count: 2, available_donors: 2, active_requests: 0, percentage: 56, status: 'moderate' },
    { blood_group: 'B+', units_in_stock: 38, target_capacity: 45, critical_threshold: 10, donor_count: 4, available_donors: 4, active_requests: 1, percentage: 84, status: 'optimal' },
    { blood_group: 'B-', units_in_stock: 8, target_capacity: 25, critical_threshold: 8, donor_count: 2, available_donors: 1, active_requests: 1, percentage: 32, status: 'critical' },
    { blood_group: 'AB+', units_in_stock: 24, target_capacity: 30, critical_threshold: 6, donor_count: 2, available_donors: 2, active_requests: 0, percentage: 80, status: 'optimal' },
    { blood_group: 'AB-', units_in_stock: 7, target_capacity: 20, critical_threshold: 5, donor_count: 2, available_donors: 1, active_requests: 1, percentage: 35, status: 'moderate' },
  ];

  const data = levels && levels.length > 0 ? levels : defaultLevels;

  const maxCapacity = Math.max(...data.map(d => d.target_capacity), 50);

  const getStatusColor = (status: 'optimal' | 'moderate' | 'critical') => {
    switch (status) {
      case 'critical':
        return {
          bar: 'bg-red-600',
          text: 'text-red-700',
          bg: 'bg-red-50 border-red-200',
          badge: 'bg-red-600 text-white',
        };
      case 'moderate':
        return {
          bar: 'bg-amber-500',
          text: 'text-amber-700',
          bg: 'bg-amber-50 border-amber-200',
          badge: 'bg-amber-500 text-slate-900',
        };
      default:
        return {
          bar: 'bg-emerald-600',
          text: 'text-emerald-700',
          bg: 'bg-emerald-50 border-emerald-200',
          badge: 'bg-emerald-600 text-white',
        };
    }
  };

  const activeItem = data.find(d => d.blood_group === selectedGroup) || data[0];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-100 text-red-600 shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{t('inventory.title')}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">
                Live Reserves
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('inventory.desc')}
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('units')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'units'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('inventory.units_view')}
            </button>
            <button
              onClick={() => setViewMode('percentage')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'percentage'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('inventory.percent_view')}
            </button>
          </div>

          <button
            onClick={() => onNavigate('blood-requests')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <span>{t('inventory.manage')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Bar Chart Visualization */}
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span>{t('inventory.optimal')} (&gt; 55%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>{t('inventory.moderate')} (30% - 55%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-red-600 font-bold">{t('inventory.critical_low')} (&lt; 30%)</span>
          </div>
          <span className="text-slate-400 hidden md:inline">• Click any group bar for detailed telemetry</span>
        </div>

        {/* Responsive Bar Columns */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-4">
          {data.map(item => {
            const colors = getStatusColor(item.status);
            const isSelected = selectedGroup === item.blood_group;
            const barHeightPct = Math.max(12, Math.round((item.units_in_stock / maxCapacity) * 100));

            return (
              <div
                key={item.blood_group}
                onClick={() => setSelectedGroup(item.blood_group)}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900/10'
                    : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                {/* Status indicator tag */}
                <div className="mb-2">
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${colors.badge} ${
                      item.status === 'critical' ? 'animate-pulse' : ''
                    }`}
                  >
                    {item.status === 'critical' ? 'Alert' : item.status}
                  </span>
                </div>

                {/* Vertical Bar Container */}
                <div className="w-full h-36 bg-slate-100 rounded-xl relative flex flex-col justify-end p-1 overflow-hidden border border-slate-200">
                  {/* Target threshold guideline */}
                  <div
                    className="absolute w-full left-0 border-b border-dashed border-slate-400 pointer-events-none"
                    style={{ bottom: `${(item.critical_threshold / maxCapacity) * 100}%` }}
                    title={`Critical Threshold: ${item.critical_threshold} Units`}
                  />

                  {/* Dynamic Colored Stock Bar */}
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded-lg transition-all duration-700 relative group flex items-start justify-center pt-1.5 shadow-sm ${colors.bar}`}
                  >
                    <span className="text-[10px] font-black text-white drop-shadow-sm select-none">
                      {viewMode === 'units' ? item.units_in_stock : `${item.percentage}%`}
                    </span>
                  </div>
                </div>

                {/* Blood Group Label */}
                <div className="mt-2.5 text-center">
                  <span className="text-base sm:text-lg font-black text-slate-900 block leading-none">
                    {item.blood_group}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block mt-1">
                    {item.units_in_stock} / {item.target_capacity} U
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Blood Group Deep-Dive Card */}
      {activeItem && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-red-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-600/40">
              {activeItem.blood_group}
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-white">
                  Blood Group {activeItem.blood_group} Reserve Status
                </h4>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    getStatusColor(activeItem.status).badge
                  }`}
                >
                  {activeItem.status}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Verified Storage: <strong>{activeItem.units_in_stock} Units</strong> available ({activeItem.percentage}% of {activeItem.target_capacity} unit buffer target).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap sm:flex-nowrap">
            <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Active Emergency Requests</span>
              <span className="text-white font-black text-sm">{activeItem.active_requests} Patients</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Registered Donors</span>
              <span className="text-emerald-400 font-black text-sm">{activeItem.available_donors} Available</span>
            </div>

            <button
              onClick={() => onNavigate('donor-directory')}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-red-600/30 shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>Contact {activeItem.blood_group} Donors</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
