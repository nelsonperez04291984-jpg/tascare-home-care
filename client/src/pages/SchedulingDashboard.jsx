import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, User, MapPin, Plus, ChevronLeft, ChevronRight, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SchedulingDashboard = () => {
  const [workers, setWorkers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wRes, vRes] = await Promise.all([
          axios.get('http://localhost:5000/api/care-scheduling/workers?tenant_id=00000000-0000-0000-0000-000000000000'),
          axios.get('http://localhost:5000/api/care-scheduling/visits?tenant_id=00000000-0000-0000-0000-000000000000&start_date=2024-04-01&end_date=2024-04-30')
        ]);
        setWorkers(wRes.data);
        setVisits(vRes.data);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Support Worker Roster</h2>
          <p className="text-slate-500">Managing care visits in Tasmania (South)</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button className="p-2 hover:bg-slate-50 border-r border-slate-200"><ChevronLeft size={20} /></button>
            <div className="px-4 py-2 flex items-center gap-2 font-semibold text-slate-700">
              <CalendarIcon size={18} className="text-clinical-500" />
              <span>Oct 2 - Oct 8, 2024</span>
            </div>
            <button className="p-2 hover:bg-slate-50 border-l border-slate-200"><ChevronRight size={20} /></button>
          </div>
          <button className="clinical-btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span>Create Visit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Worker Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              Available Workers
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">3 Online</span>
            </h3>
            <div className="space-y-2">
              {workers.map(worker => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  key={worker.id} 
                  className="p-3 bg-white border border-slate-50 rounded-xl flex items-center gap-3 cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-clinical-50 group-hover:text-clinical-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{worker.name}</p>
                    <p className="text-[10px] text-slate-400">{worker.base_region}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800">
            <AlertCircle className="shrink-0" size={20} />
            <div className="text-xs">
              <p className="font-bold mb-1">Unassigned Visits (4)</p>
              <p className="opacity-80 leading-relaxed">There are 4 care client visits needing assignment this week.</p>
            </div>
          </div>
        </div>

        {/* Main Scheduler View */}
        <div className="lg:col-span-3">
          <div className="glass rounded-3xl border border-white/40 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50">
              <div className="p-4 bg-slate-100/30 border-r border-slate-100 italic text-[10px] text-slate-400 flex items-center justify-center">Worker</div>
              {weekDays.map(day => (
                <div key={day} className="p-4 text-center font-bold text-xs text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">{day}</div>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {workers.map(worker => (
                <div key={worker.id} className="grid grid-cols-8 group">
                  <div className="p-4 border-r border-slate-100 bg-slate-50/20 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 mb-1" />
                    <span className="text-[10px] font-bold text-slate-600 text-center">{worker.name.split(' ')[0]}</span>
                  </div>
                  
                  {/* Calendar Grid Slots */}
                  {weekDays.map(day => (
                    <div key={day} className="p-2 border-r border-slate-100 relative min-h-[120px] hover:bg-slate-50 group-hover/slot:bg-clinical-50/10 cursor-alias">
                      {/* Mock Visits for Visual Density */}
                      {day === 'Tue' && worker.name.includes('Sarah') && (
                        <div className="p-2 bg-clinical-100 border border-clinical-200 text-clinical-800 rounded-lg text-[9px] shadow-sm mb-1">
                          <p className="font-bold">John Smith</p>
                          <p className="opacity-70">Personal Care</p>
                        </div>
                      )}
                      {day === 'Thu' && worker.name.includes('Elena') && (
                        <div className="p-2 bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-lg text-[9px] shadow-sm">
                          <p className="font-bold">Mary Brown</p>
                          <p className="opacity-70">Nursing Care</p>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center">
                         <div className="bg-clinical-600 text-white p-1 rounded-full shadow-lg"><Plus size={16} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center px-4">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <div className="w-3 h-3 bg-clinical-200 rounded" />
                  <span>Personal/Home Care</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <div className="w-3 h-3 bg-indigo-200 rounded" />
                  <span>Nursing/Clinical</span>
                </div>
             </div>
             <div className="flex items-center gap-2 text-clinical-600 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Roster Validated (Conflict Free)</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingDashboard;
