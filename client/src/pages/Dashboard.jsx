import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ClipboardList, CheckCircle2, XCircle, Clock, Calendar, User, MoreVertical, BadgeInfo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReferralDashboard = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/referrals?tenant_id=00000000-0000-0000-0000-000000000000');
      setReferrals(res.data);
    } catch (err) {
      console.error("Fetch referrals failed", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/referrals/${id}/status`, { status: newStatus });
      fetchReferrals();
    } catch (err) {
      console.error("Update status failed", err);
    }
  };

  const filteredReferrals = referrals.filter(ref => filter === 'all' || ref.status === filter);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'new': return 'bg-clinical-100 text-clinical-700 border-clinical-200';
      case 'contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'assessment_scheduled': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'declined': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Referral Triage Queue</h2>
          <p className="text-slate-500">Managing intake for Tasmania (South)</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input type="text" placeholder="Search client name..." className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 outline-none w-64 bg-white" />
          </div>
          <button className="clinical-btn-outline flex items-center gap-2">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">New Inbound</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold">{referrals.filter(r => r.status === 'new').length}</h3>
            <div className="p-2 bg-clinical-50 text-clinical-600 rounded-lg"><ClipboardList /></div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Assessments Scheduled</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold">{referrals.filter(r => r.status === 'assessment_scheduled').length}</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar /></div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Accepted (7d)</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold">{referrals.filter(r => r.status === 'accepted').length}</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 /></div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Declined</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold">{referrals.filter(r => r.status === 'declined').length}</h3>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><XCircle /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {['all', 'new', 'contacted', 'assessment_scheduled'].map(t => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={`pb-4 px-2 font-medium capitalize transition-all ${filter === t ? 'text-clinical-600 border-b-2 border-clinical-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Funding & Region</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Inbound Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence>
              {filteredReferrals.map((ref) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={ref.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-clinical-50 group-hover:text-clinical-600 transition-colors">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{ref.client_name}</p>
                        <p className="text-xs text-slate-500">DOB: {ref.dob ? new Date(ref.dob).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest">{ref.funding_type}</span>
                      {ref.hcp_level && <span className="text-xs font-medium text-clinical-600">Level {ref.hcp_level}</span>}
                    </div>
                    <p className="text-xs text-slate-500">Area: {ref.service_area || 'Hobart'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(ref.status)} uppercase tracking-tight`}>
                      {ref.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(ref.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <select 
                        onChange={(e) => updateStatus(ref.id, e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                        value={ref.status}
                       >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="assessment_scheduled">Schedule assessment</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                       </select>
                       <button className="p-2 text-slate-400 hover:text-slate-600"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredReferrals.length === 0 && !loading && (
          <div className="p-20 text-center text-slate-400">
            <BadgeInfo size={48} className="mx-auto mb-4 opacity-20" />
            <p>No referrals in this queue</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboard;
