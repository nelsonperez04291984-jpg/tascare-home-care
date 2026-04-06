import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon, User, Plus, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Loader2, WifiOff, X, Clock, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';
const WEEK_DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SERVICE_TYPES = [
  'Personal Care',
  'Nursing Care',
  'Meal Preparation',
  'Transport',
  'Companionship',
  'Housekeeping',
  'Medication Reminder',
  'Dementia Support',
  'Respite Care',
];

const SERVICE_COLORS = {
  'Personal Care':        'bg-clinical-100 border-clinical-200 text-clinical-800',
  'Nursing Care':         'bg-indigo-100 border-indigo-200 text-indigo-800',
  'Meal Preparation':     'bg-amber-100 border-amber-200 text-amber-800',
  'Transport':            'bg-green-100 border-green-200 text-green-800',
  'Companionship':        'bg-rose-100 border-rose-200 text-rose-800',
  'Housekeeping':         'bg-purple-100 border-purple-200 text-purple-800',
  'Medication Reminder':  'bg-teal-100 border-teal-200 text-teal-800',
  'Dementia Support':     'bg-orange-100 border-orange-200 text-orange-800',
  'Respite Care':         'bg-cyan-100 border-cyan-200 text-cyan-800',
  'default':              'bg-slate-100 border-slate-200 text-slate-700',
};

const visitColor = (type) => SERVICE_COLORS[type] || SERVICE_COLORS.default;

/* ── helpers ────────────────────────────────────────────────── */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
const addDays  = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };
const fmtDate  = (date)    => date.toISOString().split('T')[0];
const fmtWeekLabel = (start) => {
  const end  = addDays(start, 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-AU', opts)} – ${end.toLocaleDateString('en-AU', opts)}, ${end.getFullYear()}`;
};

/* ── Create Visit Modal ─────────────────────────────────────── */
const CreateVisitModal = ({ workers, initialWorker, initialDate, onClose, onCreated }) => {
  const [form, setForm] = useState({
    worker_id:      initialWorker?.id   || '',
    scheduled_date: initialDate         || fmtDate(new Date()),
    scheduled_time: '09:00',
    service_type:   'Personal Care',
    client_name:    '',
    duration_hours: '1',
    notes:          '',
  });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.worker_id)   return setError('Please select a worker.');
    if (!form.client_name) return setError('Please enter a client name.');

    setSaving(true);
    setError(null);
    try {
      const scheduled_at = `${form.scheduled_date}T${form.scheduled_time}:00`;
      await axios.post('/api/care-scheduling/visits', {
        tenant_id:      TENANT_ID,
        worker_id:      form.worker_id,
        client_id:      null,           // will link to clients table later
        service_type:   form.service_type,
        scheduled_at,
        duration_hours: parseFloat(form.duration_hours),
        notes:          `${form.client_name}${form.notes ? ' — ' + form.notes : ''}`,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create visit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-clinical-50 rounded-xl">
                <CalendarIcon size={20} className="text-clinical-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Create Visit</h3>
                <p className="text-xs text-slate-400">Schedule a care visit for a client</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

            {/* Client Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-clinical-400 focus:border-clinical-400 outline-none transition-all"
                required
              />
            </div>

            {/* Worker */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Support Worker <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.worker_id}
                onChange={e => set('worker_id', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-clinical-400 outline-none bg-white transition-all"
                required
              >
                <option value="">— Select worker —</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Service Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SERVICE_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set('service_type', type)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                      form.service_type === type
                        ? 'bg-clinical-600 text-white border-clinical-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-clinical-300 hover:bg-clinical-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time + Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={e => set('scheduled_date', e.target.value)}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-clinical-400 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={form.scheduled_time}
                  onChange={e => set('scheduled_time', e.target.value)}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-clinical-400 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Duration (hrs)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={form.duration_hours}
                  onChange={e => set('duration_hours', e.target.value)}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-clinical-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Notes <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any special instructions…"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-clinical-400 outline-none resize-none transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-clinical-600 text-white rounded-xl font-semibold hover:bg-clinical-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={16} /> Create Visit</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ── Main Component ─────────────────────────────────────────── */
const SchedulingDashboard = () => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [workers, setWorkers]     = useState([]);
  const [visits,  setVisits]      = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(null);

  // Modal state
  const [modal, setModal] = useState({ open: false, worker: null, date: null });

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

  const openModal = (worker = null, date = null) =>
    setModal({ open: true, worker, date: date ? fmtDate(date) : null });

  const closeModal = () => setModal({ open: false, worker: null, date: null });

  const getVisits = (workerId, date) => {
    const dayStr = fmtDate(date);
    return visits.filter(v => {
      const vDay = v.scheduled_at?.split('T')[0];
      return v.worker_id === workerId && vDay === dayStr;
    });
  };

  return (
    <>
      {/* Create Visit Modal */}
      {modal.open && (
        <CreateVisitModal
          workers={workers}
          initialWorker={modal.worker}
          initialDate={modal.date}
          onClose={closeModal}
          onCreated={fetchData}
        />
      )}

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
              <button onClick={() => setWeekStart(w => addDays(w, -7))} className="p-2.5 hover:bg-slate-50 border-r border-slate-200 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setWeekStart(getWeekStart(new Date()))} className="px-4 py-2 flex items-center gap-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-sm">
                <CalendarIcon size={16} className="text-clinical-500" />
                {fmtWeekLabel(weekStart)}
              </button>
              <button onClick={() => setWeekStart(w => addDays(w, 7))} className="p-2.5 hover:bg-slate-50 border-l border-slate-200 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => openModal()}
              className="clinical-btn-primary flex items-center gap-2"
            >
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
              <p className="text-xs opacity-60 mt-1">Visit <strong>/api/migrate</strong> to initialise database tables, then retry.</p>
            </div>
            <button onClick={fetchData} className="ml-auto text-xs font-bold border border-rose-300 rounded-lg px-3 py-1.5 hover:bg-rose-100 transition-colors shrink-0">
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
                <div className="flex justify-center py-8 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>
              ) : error ? (
                <p className="text-xs text-slate-400 italic">Workers unavailable</p>
              ) : workers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No workers found. Run /api/migrate to seed data.</p>
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
                        <p className="text-[10px] text-slate-400">{(worker.service_areas || []).join(', ') || 'All areas'}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-clinical-50 border border-clinical-100 rounded-2xl flex gap-3 text-clinical-800">
              <AlertCircle className="shrink-0" size={18} />
              <div className="text-xs">
                <p className="font-bold mb-1">How to create visits</p>
                <p className="opacity-80 leading-relaxed">
                  Click any cell in the roster grid, or use the <strong>Create Visit</strong> button above.
                </p>
              </div>
            </div>
          </div>

          {/* Roster Grid */}
          <div className="lg:col-span-3">
            <div className="glass rounded-3xl border border-white/40 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="grid border-b border-slate-100 bg-slate-50/60" style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}>
                <div className="p-4 border-r border-slate-100 text-[10px] text-slate-400 italic flex items-center justify-center">Worker</div>
                {weekDates.map((date, i) => {
                  const isToday = fmtDate(date) === fmtDate(new Date());
                  return (
                    <div key={i} className={`p-3 text-center border-r border-slate-100 last:border-0 ${isToday ? 'bg-clinical-50' : ''}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-clinical-600' : 'text-slate-400'}`}>{WEEK_DAYS[i]}</p>
                      <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-clinical-600' : 'text-slate-600'}`}>{date.getDate()}</p>
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
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
                    <div key={worker.id} className="grid" style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}>
                      <div className="p-3 border-r border-slate-100 bg-slate-50/20 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 mb-1 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                          {worker.name.split(' ')[0]}
                        </span>
                      </div>
                      {weekDates.map((date, i) => {
                        const dayVisits = getVisits(worker.id, date);
                        const isToday   = fmtDate(date) === fmtDate(new Date());
                        return (
                          <div
                            key={i}
                            onClick={() => openModal(worker, date)}
                            className={`p-2 border-r border-slate-100 last:border-0 min-h-[100px] relative group cursor-pointer transition-colors ${isToday ? 'bg-clinical-50/30' : 'hover:bg-slate-50'}`}
                          >
                            {dayVisits.map(v => (
                              <div key={v.id} className={`p-1.5 rounded-lg border text-[9px] shadow-sm mb-1 ${visitColor(v.service_type)}`}>
                                <p className="font-bold truncate">{v.notes?.split(' — ')[0] || 'Client'}</p>
                                <p className="opacity-70">{v.service_type}</p>
                              </div>
                            ))}
                            {/* + hover indicator */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-end justify-end p-1.5 transition-opacity pointer-events-none">
                              <div className="bg-clinical-600 text-white p-1 rounded-full shadow-lg">
                                <Plus size={12} />
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
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 px-2">
              {Object.entries(SERVICE_COLORS).filter(([k]) => k !== 'default').map(([type, cls]) => (
                <div key={type} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <div className={`w-3 h-3 rounded border ${cls}`} />
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SchedulingDashboard;
