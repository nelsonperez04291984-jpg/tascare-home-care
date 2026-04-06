import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Calendar, Users, FilePlus, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between"
  >
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-4xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
  </motion.div>
);

const QuickAction = ({ to, icon: Icon, title, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Link
      to={to}
      className="group flex items-center gap-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-clinical-200 transition-all"
    >
      <div className={`p-4 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={26} />
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-800 text-lg">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      <ArrowRight size={20} className="text-slate-300 group-hover:text-clinical-500 group-hover:translate-x-1 transition-all" />
    </Link>
  </motion.div>
);

const HomeDashboard = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/referrals?tenant_id=${TENANT_ID}`)
      .then(res => setReferrals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    new: referrals.filter(r => r.status === 'new').length,
    assessment: referrals.filter(r => r.status === 'assessment_scheduled').length,
    accepted: referrals.filter(r => r.status === 'accepted').length,
    declined: referrals.filter(r => r.status === 'declined').length,
    total: referrals.length,
  };

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-10 max-w-5xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-sm font-medium text-slate-400 mb-1">{today}</p>
        <h2 className="text-4xl font-bold text-slate-800">Good day, TasCare Team 👋</h2>
        <p className="text-slate-500 mt-1">Here's your overview for Tasmania (South)</p>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="New Referrals" value={loading ? '—' : stats.new} icon={ClipboardList} color="bg-clinical-50 text-clinical-600" delay={0.05} />
        <StatCard label="Assessments Due" value={loading ? '—' : stats.assessment} icon={Clock} color="bg-indigo-50 text-indigo-600" delay={0.1} />
        <StatCard label="Accepted (Total)" value={loading ? '—' : stats.accepted} icon={CheckCircle2} color="bg-green-50 text-green-600" delay={0.15} />
        <StatCard label="Declined" value={loading ? '—' : stats.declined} icon={XCircle} color="bg-rose-50 text-rose-600" delay={0.2} />
      </div>

      {/* Alert if new referrals waiting */}
      {!loading && stats.new > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800"
        >
          <AlertCircle size={22} className="shrink-0" />
          <div>
            <p className="font-bold">{stats.new} new referral{stats.new > 1 ? 's' : ''} awaiting triage</p>
            <p className="text-sm opacity-80">Review and action them in the Referrals queue.</p>
          </div>
          <Link to="/referrals" className="ml-auto text-sm font-bold text-amber-700 hover:underline flex items-center gap-1">
            View Queue <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction to="/referrals" icon={ClipboardList} title="Referral Triage Queue" desc="Review, action and track all incoming referrals" color="bg-clinical-50 text-clinical-600" delay={0.1} />
          <QuickAction to="/public-referral" icon={FilePlus} title="Submit New Referral" desc="Hospital, GP or family intake portal" color="bg-indigo-50 text-indigo-600" delay={0.15} />
          <QuickAction to="/scheduling" icon={Calendar} title="Worker Scheduling" desc="View and manage support worker rosters" color="bg-green-50 text-green-600" delay={0.2} />
          <QuickAction to="/clients" icon={Users} title="Client Directory" desc="View all active and pending clients" color="bg-slate-100 text-slate-500" delay={0.25} />
        </div>
      </div>

      {/* Recent Referrals Preview */}
      {!loading && referrals.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Referrals</h3>
            <Link to="/referrals" className="text-xs font-bold text-clinical-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {referrals.slice(0, 5).map((ref, i) => (
              <motion.div
                key={ref.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{ref.client_name}</p>
                    <p className="text-xs text-slate-400">{ref.funding_type} · {ref.service_area || 'Hobart'}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-tight ${
                  ref.status === 'new' ? 'bg-clinical-100 text-clinical-700 border-clinical-200' :
                  ref.status === 'contacted' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  ref.status === 'assessment_scheduled' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                  ref.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                  'bg-rose-100 text-rose-700 border-rose-200'
                }`}>
                  {ref.status.replace('_', ' ')}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Compliance footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 pt-6"
      >
        <Activity size={14} />
        <span>TasCare complies with the Aged Care Quality and Safety Commission standards · Home Care Package administration · CHSP reporting</span>
      </motion.div>
    </div>
  );
};

export default HomeDashboard;
