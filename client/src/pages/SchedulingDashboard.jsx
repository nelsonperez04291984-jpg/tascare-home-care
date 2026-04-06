import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon, User, Plus, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Loader2, WifiOff, X, Clock, MapPin, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    client_suburb:  'Hobart',
    duration_hours: '1',
    notes:          '',
    repeat:         'None',       // 'None', 'Daily', 'Weekly'
    repeat_count:   1,            // How many times it repeats total
  });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState(null);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Simulate rich logistical data for the distance only, now map availability from the real backend
  const getWorkerLogistics = (workerId, idx) => {
    const distances = ['1.2km', '3.4km', '8.5km', '4.1km', '2.0km'];
    return {
      distance: distances[idx % distances.length],
    };
  };

  useEffect(() => {
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const res = await axios.get(`/api/care-scheduling/workers?target_date=${form.scheduled_date}&target_time=${form.scheduled_time}&duration_hours=${form.duration_hours}&target_suburb=${form.client_suburb}&service_type=${form.service_type}`);
        setAvailableWorkers(res.data);
        
        // If the currently selected worker becomes unavailable, auto-deselect them to prevent errors
        if (form.worker_id) {
          const selected = res.data.find(w => w.id === form.worker_id);
          if (selected && !selected.is_available) {
            set('worker_id', '');
          }
        }
      } catch (err) {
        console.error("Failed to fetch availability", err);
      } finally {
        setCheckingAvailability(false);
      }
    };
    checkAvailability();
  }, [form.scheduled_date, form.scheduled_time, form.duration_hours, form.client_suburb, form.service_type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.worker_id)   return setError('Please select a worker.');
    if (!form.client_name) return setError('Please enter a client name.');

    setSaving(true);
    setError(null);
    try {
      const datesToSchedule = [];
      const baseDate = new Date(form.scheduled_date);
      
      let totalOccurrences = 1;
      if (form.repeat === 'Daily') totalOccurrences = form.repeat_count;
      else if (form.repeat === 'Weekly') totalOccurrences = form.repeat_count;

      for (let i = 0; i < totalOccurrences; i++) {
        let nextDate = new Date(baseDate);
        if (form.repeat === 'Daily') nextDate.setDate(nextDate.getDate() + i);
        else if (form.repeat === 'Weekly') nextDate.setDate(nextDate.getDate() + (i * 7));
        
        const scheduled_at = `${fmtDate(nextDate)}T${form.scheduled_time}:00`;
        datesToSchedule.push(axios.post('/api/care-scheduling/visits', {
          worker_id:      form.worker_id,
          client_id:      null,
          service_type:   form.service_type,
          scheduled_at,
          duration_hours: parseFloat(form.duration_hours),
          notes:          `${form.client_name}${form.notes ? ' — ' + form.notes : ''}`,
        }));
      }

      await Promise.all(datesToSchedule);

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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-clinical-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-clinical-100 rounded-xl">
                <CalendarIcon size={20} className="text-clinical-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Dispatch & Schedule Visit</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide">AI logistics active</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1 p-8 space-y-6">

            {/* Client Name & Service */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={e => set('client_name', e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-clinical-400 focus:border-clinical-400 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Client Suburb (Target)
                </label>
                <select
                  value={form.client_suburb}
                  onChange={e => set('client_suburb', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-clinical-400 outline-none bg-white transition-all cursor-pointer"
                >
                  {['Hobart', 'Kingston', 'Glenorchy', 'Bellerive', 'Sandy Bay', 'Taroona', 'Moonah', 'Claremont', 'Rokeby', 'Howrah'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Service Type
                </label>
                <select
                  value={form.service_type}
                  onChange={e => set('service_type', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-clinical-400 outline-none bg-white transition-all cursor-pointer"
                >
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Logistics: Date + Recurring + Duration */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" /> Time & Logistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={e => set('scheduled_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none transition-all bg-white"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Time</label>
                  <input
                    type="time"
                    value={form.scheduled_time}
                    onChange={e => set('scheduled_time', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none transition-all bg-white"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Duration</label>
                  <select 
                    value={form.duration_hours} 
                    onChange={e => set('duration_hours', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none bg-white cursor-pointer"
                  >
                    {[0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 12, 24].map(h => (
                      <option key={h} value={h}>{h} hr{h !== 1 && 's'}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Repeat Pattern</label>
                  <select
                    value={form.repeat}
                    onChange={e => set('repeat', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-400 text-blue-700 bg-blue-50 outline-none cursor-pointer"
                  >
                    <option value="None">Once Only</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>
              
              <AnimatePresence>
                {form.repeat !== 'None' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-2">
                    <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <span className="text-sm font-medium text-slate-600">Assign for the next</span>
                      <input 
                        type="number" min="2" max="30" value={form.repeat_count} onChange={e => set('repeat_count', parseInt(e.target.value) || 2)}
                        className="w-16 px-2 py-1 text-center font-bold border border-blue-200 rounded text-blue-700 outline-none"
                      />
                      <span className="text-sm font-medium text-slate-600">{form.repeat === 'Daily' ? 'Days' : 'Weeks'}</span>
                      <span className="ml-auto text-xs font-bold text-blue-600 uppercase tracking-wider">{form.repeat_count} shifts generated</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Smart Worker Assignment */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Optimization Engine: Select Worker <span className="text-rose-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar p-1">
                {checkingAvailability ? (
                  <div className="col-span-full py-8 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mb-2" />
                    <span className="text-xs font-semibold">Running availability engine…</span>
                  </div>
                ) : availableWorkers.map((w, idx) => {
                  const isSelected = form.worker_id === w.id;
                  const isAvailable = w.is_available;
                  const isBestMatch = idx === 0 && isAvailable;
                  
                  const complianceColor = w.compliance_status === 'non_compliant' ? 'text-rose-500' : 
                                         w.compliance_status === 'warning' ? 'text-amber-500' : 'text-emerald-500';
                  
                  return (
                    <div 
                      key={w.id} 
                      onClick={() => isAvailable && set('worker_id', w.id)}
                      className={`transition-all border-2 rounded-2xl p-4 relative overflow-hidden
                        ${!isAvailable ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' : 'cursor-pointer hover:border-clinical-200 hover:bg-slate-50 border-slate-100'} 
                        ${isSelected ? 'border-clinical-500 bg-clinical-50 shadow-md ring-2 ring-clinical-100 opacity-100' : ''}`}
                    >
                      {/* Capability Match Score Tag */}
                      <div className="absolute top-0 right-0 px-3 py-1 bg-slate-100 border-l border-b border-slate-200 rounded-bl-xl text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <TrendingUp size={10} className="text-clinical-500"/>
                        {w.logistical_score}% Match
                      </div>

                      {isBestMatch && (
                        <div className="absolute top-2 left-0 px-2 py-0.5 bg-emerald-500 text-white rounded-r-md text-[8px] font-black uppercase tracking-widest shadow-sm z-10">
                          Best Match
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mt-1">
                        <div className="flex-1 pr-12">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${!isAvailable ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{w.name}</p>
                            {w.compliance_status === 'compliant' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                            {w.compliance_status === 'warning' && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></div>}
                            {w.compliance_status === 'non_compliant' && <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"></div>}
                          </div>

                          <div className={`flex items-center gap-1.5 text-xs mt-1 font-medium ${complianceColor}`}>
                            {w.is_available ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>} 
                            {w.availability_reason || 'Unknown'}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                              <MapPin size={10} className="text-clinical-400"/> 
                              <span className="font-bold">{w.distance_km}km</span>
                            </div>
                            {w.is_authorized ? (
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                <ShieldCheck size={10}/> AUTHORIZED
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                                <AlertTriangle size={10}/> NO AUTH
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`mt-2 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-clinical-500 border-clinical-500 text-white' : 'border-slate-200 bg-white'}`}>
                          {isSelected && <CheckCircle2 size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                className="flex-1 py-3 bg-clinical-600 text-white rounded-xl font-bold hover:bg-clinical-700 transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Distributing Shifts…</> : <><CheckCircle2 size={18} /> Confirm {form.repeat !== 'None' ? 'Recurring Schedule' : 'Schedule'}</>}
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
        axios.get('/api/care-scheduling/workers'),
        axios.get(`/api/care-scheduling/visits?start_date=${startStr}&end_date=${endStr}`),
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
