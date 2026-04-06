import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon, User, Plus, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Loader2, WifiOff
} from 'lucide-react';
import { motion } from 'framer-motion';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get Monday of the week containing a given date
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const fmtDate = (date) =>
  date.toISOString().split('T')[0];

const fmtWeekLabel = (start) => {
  const end = addDays(start, 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-AU', opts)} – ${end.toLocaleDateString('en-AU', opts)}, ${end.getFullYear()}`;
};

const SERVICE_COLORS = {
  'Personal Care':    'bg-clinical-100 border-clinical-200 text-clinical-800',
  'Nursing Care':     'bg-indigo-100 border-indigo-200 text-indigo-800',
  'Meal Preparation': 'bg-amber-100 border-amber-200 text-amber-800',
  'Transport':        'bg-green-100 border-green-200 text-green-800',
  'Companionship':    'bg-rose-100 border-rose-200 text-rose-800',
  'default':          'bg-slate-100 border-slate-200 text-slate-700',
};

const visitColor = (type) => SERVICE_COLORS[type] || SERVICE_COLORS.default;

const SchedulingDashboard = () => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [workers, setWorkers]     = useState([]);
  const [visits, setVisits]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const startStr  = fmtDate(weekStart);
  const endStr    = fmtDate(addDays(weekStart, 6));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, vRes] = await Promise.all([
        axios.get(`/api/care-scheduling/workers?tenant_id=${TENANT_ID}`),
        axios.get(`/api/care-scheduling/visits?tenant_id=${TENANT_ID}&start_date=${startStr}&end_date=${endStr}`),
      ]);
      setWorkers(wRes.data);
      setVisits(vRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not load scheduling data.');
    } finally {
      setLoading(false);
    }
  }, [startStr, endStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevWeek = () => setWeekStart(w => addDays(w, -7));
  const nextWeek = () => setWeekStart(w => addDays(w, 7));
  const goToday  = () => setWeekStart(getWeekStart(new Date()));

  // Visits for a specific worker on a specific day
  const getVisits = (workerId, date) => {
    const dayStr = fmtDate(date);
    return visits.filter(v => {
      const vDay = v.scheduled_at?.split('T')[0];
      return v.worker_id === workerId && vDay === dayStr;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Support Worker Roster</h2>
          <p className="text-slate-500">Managing care visits in Tasmania (South)</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Week Navigator */}
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={prevWeek}
              className="p-2.5 hover:bg-slate-50 border-r border-slate-200 transition-colors"
              title="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToday}
              className="px-4 py-2 flex items-center gap-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-sm"
            >
              <CalendarIcon size={16} className="text-clinical-500" />
              {fmtWeekLabel(weekStart)}
            </button>
            <button
              onClick={nextWeek}
              className="p-2.5 hover:bg-slate-50 border-l border-slate-200 transition-colors"
              title="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button className="clinical-btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Create Visit</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <WifiOff size={20} className="shrink-0" />
          <div>
            <p className="font-bold text-sm">Could not load scheduling data</p>
            <p className="text-xs opacity-80 mt-0.5">{error}</p>
            <p className="text-xs opacity-60 mt-1">Make sure the database is set up — visit <strong>/api/migrate</strong> to initialise tables.</p>
          </div>
          <button onClick={fetchData} className="ml-auto text-xs font-bold border border-rose-300 rounded-lg px-3 py-1.5 hover:bg-rose-100 transition-colors">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Worker Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              Available Workers
              {!loading && !error && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {workers.length} Active
                </span>
              )}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : error ? (
              <p className="text-xs text-slate-400 italic">Workers unavailable</p>
            ) : workers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No workers found for this tenant.</p>
            ) : (
              <div className="space-y-2">
                {workers.map(worker => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={worker.id}
                    className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3 cursor-pointer hover:shadow-md transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-clinical-50 group-hover:text-clinical-600 transition-colors">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{worker.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {(worker.service_areas || []).join(', ') || 'All areas'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800">
            <AlertCircle className="shrink-0" size={18} />
            <div className="text-xs">
              <p className="font-bold mb-1">Tip</p>
              <p className="opacity-80 leading-relaxed">
                Click a cell in the roster to assign a visit. Visits display in the worker's row.
              </p>
            </div>
          </div>
        </div>

        {/* Roster Grid */}
        <div className="lg:col-span-3">
          <div className="glass rounded-3xl border border-white/40 shadow-2xl overflow-hidden">
            {/* Header row */}
            <div className="grid border-b border-slate-100 bg-slate-50/60" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
              <div className="p-4 border-r border-slate-100 text-[10px] text-slate-400 italic flex items-center justify-center">
                Worker
              </div>
              {weekDates.map((date, i) => {
                const isToday = fmtDate(date) === fmtDate(new Date());
                return (
                  <div
                    key={i}
                    className={`p-3 text-center border-r border-slate-100 last:border-0 ${isToday ? 'bg-clinical-50' : ''}`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-clinical-600' : 'text-slate-400'}`}>
                      {WEEK_DAYS[i]}
                    </p>
                    <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-clinical-600' : 'text-slate-600'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Worker rows */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-sm">Loading roster…</span>
              </div>
            ) : error || workers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <User size={36} className="opacity-20" />
                <p className="text-sm">No workers to display</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workers.map(worker => (
                  <div key={worker.id} className="grid" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
                    {/* Worker label */}
                    <div className="p-3 border-r border-slate-100 bg-slate-50/20 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-slate-200 mb-1 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                        {worker.name.split(' ')[0]}
                      </span>
                    </div>
                    {/* Day cells */}
                    {weekDates.map((date, i) => {
                      const dayVisits = getVisits(worker.id, date);
                      const isToday = fmtDate(date) === fmtDate(new Date());
                      return (
                        <div
                          key={i}
                          className={`p-2 border-r border-slate-100 last:border-0 min-h-[100px] relative group cursor-alias transition-colors ${isToday ? 'bg-clinical-50/30' : 'hover:bg-slate-50'}`}
                        >
                          {dayVisits.map(v => (
                            <div
                              key={v.id}
                              className={`p-1.5 rounded-lg border text-[9px] shadow-sm mb-1 ${visitColor(v.service_type)}`}
                            >
                              <p className="font-bold truncate">{v.client_name || 'Client'}</p>
                              <p className="opacity-70">{v.service_type}</p>
                            </div>
                          ))}
                          {/* Add visit hover button */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <div className="bg-clinical-600 text-white p-1 rounded-full shadow-lg">
                              <Plus size={14} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 flex justify-between items-center px-2">
            <div className="flex items-center gap-5 flex-wrap">
              {Object.entries(SERVICE_COLORS).filter(([k]) => k !== 'default').map(([type, cls]) => (
                <div key={type} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <div className={`w-3 h-3 rounded border ${cls}`} />
                  <span>{type}</span>
                </div>
              ))}
            </div>
            {!loading && !error && (
              <div className="flex items-center gap-2 text-clinical-600 font-bold text-sm">
                <CheckCircle2 size={16} />
                <span>Roster Loaded</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingDashboard;
