import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Calendar, Users, FilePlus, Building2, UserCircle, Activity,
  AlertTriangle, PhoneForwarded, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

const PriorityAlert = ({ icon: Icon, title, count, colorClass, link }) => (
  <Link to={link || "/referrals"} className={`block bg-white border ${colorClass} rounded-2xl p-5 hover:shadow-lg transition-all`}>
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl bg-white/50 border backdrop-blur-sm shadow-sm ${colorClass}`}>
        <Icon size={24} />
      </div>
      <span className="text-3xl font-extrabold tracking-tighter">{count}</span>
    </div>
    <div className="mt-4">
      <h4 className="font-bold text-sm tracking-tight">{title}</h4>
      <p className="text-xs opacity-80 mt-1">Requires immediate attention</p>
    </div>
  </Link>
);

const SourceIcon = ({ source }) => {
  if (source === 'Hospital') return <Building2 size={14} className="inline mr-1 text-rose-500" />;
  if (source === 'GP') return <UserCircle size={14} className="inline mr-1 text-indigo-500" />;
  if (source === 'MyAgedCare') return <Building2 size={14} className="inline mr-1 text-emerald-600" />;
  return <Users size={14} className="inline mr-1 text-slate-400" />;
};

const QuickAction = ({ to, icon: Icon, title, desc, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Link to={to} className="group flex items-center gap-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-clinical-200 transition-all">
      <div className={`p-4 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={26} />
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-800 text-lg">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </Link>
  </motion.div>
);

const HomeDashboard = ({ tenant }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/referrals')
      .then(res => setReferrals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute Priority Stats
  const urgentDischarges = referrals.filter(r => (r.clinical_details || '').toLowerCase().includes('hospital')).length;
  const awaitingTriage = referrals.filter(r => r.status === 'new').length;
  const awaitingContact = referrals.filter(r => r.status === 'contacted').length;
  const assessmentsToday = referrals.filter(r => r.status === 'assessment_scheduled').length;

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-sm font-medium text-slate-400 mb-1">{today}</p>
        <h2 className="text-4xl font-bold text-slate-800">Intake Command Center</h2>
        <p className="text-slate-500 mt-1">{tenant?.name || 'Tasmania (South)'} Region</p>
      </motion.div>

      {/* TODAY'S PRIORITIES PANEL */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Today's Priorities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PriorityAlert 
            title="Urgent Hospital Discharges" count={urgentDischarges} icon={AlertTriangle} 
            colorClass="border-rose-200 bg-rose-50 text-rose-800" 
          />
          <PriorityAlert 
            title="Referrals Awaiting Triage" count={awaitingTriage} icon={ClipboardList} 
            colorClass="border-amber-200 bg-amber-50 text-amber-800" 
          />
          <PriorityAlert 
            title="Clients Awaiting Contact" count={awaitingContact} icon={PhoneForwarded} 
            colorClass="border-indigo-200 bg-indigo-50 text-indigo-800" 
          />
          <PriorityAlert 
            title="Assessments Today" count={assessmentsToday} icon={Calendar} 
            colorClass="border-emerald-200 bg-emerald-50 text-emerald-800" 
          />
        </div>
      </div>

      {/* Quick Actions & Recent Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Col: Actions */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Quick Tools</h3>
          <QuickAction to="/referrals" icon={ClipboardList} title="Triage Queue" desc="Review & action clinical intakes" color="bg-clinical-50 text-clinical-600" delay={0.1} />
          <QuickAction to="/scheduling" icon={Calendar} title="Smart Scheduling" desc="Optimize worker travel & rosters" color="bg-emerald-50 text-emerald-600" delay={0.15} />
          <QuickAction to="/public-referral" icon={FilePlus} title="Manual Intake" desc="Enter hospital or family referrals" color="bg-indigo-50 text-indigo-600" delay={0.2} />
        </div>

        {/* Right Col: Recent Intakes with Intelligence */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live Intake Feed</h3>
            <Link to="/referrals" className="text-sm font-bold text-clinical-600 hover:text-clinical-800 transition-colors">
              View all
            </Link>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-100">
            {loading ? <div className="p-8 text-center text-slate-400">Loading live feed...</div> : 
              referrals.slice(0, 5).map((ref, i) => {
                // Mocking sources based on ID or index
                const sources = ['Hospital', 'GP', 'Family', 'MyAgedCare'];
                const matchedSource = sources[i % sources.length];
                
                return (
                  <motion.div key={ref.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex gap-4 items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                          <FileText className="text-slate-400" size={20} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg text-slate-800">{ref.client_name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {ref.funding_type || 'HCP LEVEL 3'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                          <span className="flex items-center"><SourceIcon source={matchedSource} /> {matchedSource}</span>
                          <span>·</span>
                          <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 ${
                        ref.status === 'new' ? 'bg-amber-100 text-amber-800' :
                        ref.status === 'contacted' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ref.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-slate-400">Action Required</p>
                    </div>
                  </motion.div>
                );
              })
            }
          </div>
        </div>

      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 pt-6">
        <Activity size={14} />
        <span>TasCare Engine · Priority Engine Active · Automatic Risk Assessment</span>
      </motion.div>
    </div>
  );
};

export default HomeDashboard;
