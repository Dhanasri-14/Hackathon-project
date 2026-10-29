import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';
import { Donor } from '../types.ts';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer.tsx';

export const DonorDirectoryPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [bloodGroup, setBloodGroup] = useState('All');
  const [availability, setAvailability] = useState('All');

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bloodGroup !== 'All') params.append('blood_group', bloodGroup);
      if (availability !== 'All') params.append('availability', availability);
      if (searchCity) params.append('city', searchCity);

      const res = await apiRequest<{ donors: Donor[] }>(`/blood/donors?${params.toString()}`);
      setDonors(res.donors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [bloodGroup, availability, searchCity]);

  const isPrivileged = user?.role === 'hospital_staff' || user?.role === 'admin';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Verified Donor Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {t('nav.donor_directory')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered volunteer donors across Tamil Nadu available for clinical emergency requests.
          </p>
        </div>

        <button
          onClick={() => onNavigate('donor-profile')}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
        >
          <HeartPulse className="w-4 h-4" />
          <span>Register / Update Donor Profile</span>
        </button>
      </div>

      <MedicalDisclaimer compact />

      {/* Privacy note */}
      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Donor Privacy Protection:</strong> Direct contact details are restricted to verified hospital blood bank officers and system administrators. Standard users view protected contact summaries.
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search city (e.g. Chennai)..."
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          <select
            value={bloodGroup}
            onChange={e => setBloodGroup(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={availability}
            onChange={e => setAvailability(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="All">All Availabilities</option>
            <option value="available">Actively Available</option>
            <option value="on_hold">On Hold / Cooldown</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Found <strong>{donors.length}</strong> donors
        </div>
      </div>

      {/* Donor Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading donor directory...
        </div>
      ) : donors.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No donors match your search filters</h4>
          <p className="text-xs text-slate-500">Try clearing the blood group or city filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map(d => (
            <div
              key={d.donor_id || d.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                      {d.blood_group}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900">{d.full_name}</h4>
                        {d.verified_badge === 1 && (
                          <span title="Verified Volunteer">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {d.locality ? `${d.locality}, ` : ''}{d.city}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.availability_status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.availability_status === 'on_hold'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t(`status.${d.availability_status}`)}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono font-semibold text-slate-800">{d.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Donations:</span>
                    <span className="font-bold text-slate-800">{d.total_donations || 0} times</span>
                  </div>
                  {d.last_donation_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Last Donated:</span>
                      <span className="text-slate-700">{d.last_donation_date}</span>
                    </div>
                  )}
                  {d.age && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Age:</span>
                      <span className="text-slate-700">{d.age} yrs ({d.gender || 'Not specified'})</span>
                    </div>
                  )}
                </div>

                {isPrivileged && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        try {
                          await apiRequest(`/blood/donors/${d.donor_id || d.id}/verify`, {
                            method: 'POST',
                            body: JSON.stringify({ is_verified: d.verified_badge === 0 }),
                          });
                          fetchDonors();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`w-full py-2 rounded-xl text-[10px] font-black uppercase transition flex items-center justify-center gap-1.5 ${
                        d.verified_badge === 1
                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                      }`}
                    >
                      {d.verified_badge === 1 ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Revoke Verification</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify Donor Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Emergency Alerts: <strong>Opted-In</strong></span>
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
