import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ClipboardList, CheckCircle2, XCircle, Clock, Calendar, User, Phone, Navigation2, Building2, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReferralDashboard = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await axios.get('/api/referrals?tenant_id=00000000-0000-0000-0000-000000000000');
      setReferrals(res.data);
    } catch (err) {
      console.error("Fetch referrals failed", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await axios.patch(`/api/referrals/${id}/status`, { status: newStatus });
      await fetchReferrals();
    } catch (err) {
      console.error("Update status failed", err);
    }
    setActionLoading(null);
  };

  const filteredReferrals = referrals.filter(ref => filter === 'all' || ref.status === filter);

  // Simulated AI Mappings for missing clinical data
  const getMockClinicalData = (id, index) => {
    const risks = ['Fall Risk', 'Dementia Risk', 'Low Risk', 'Complex Needs', 'Social Isolation'];
    const distances = ['1.2km', '4.5km', '12km', '6km', '8.5km'];
    const services = ['Nursing + Personal Care', 'Domestic Assistance', 'Allied Health', 'Respite Care', 'Transport'];
    const sources = ['Hospital', 'GP', 'MyAgedCare', 'Family', 'Hospital'];
    return {
      risk: risks[index % risks.length],
      distance: distances[index % distances.length],
      service: services[index % services.length],
      source: sources[index % sources.length]
    };
  };

  const getFundingBadge = (type) => {
    const defaultType = type || 'HCP LEVEL 3';
    if (defaultType.toUpperCase().includes('HCP')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (defaultType.toUpperCase().includes('CHSP')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (defaultType.toUpperCase().includes('NDIS')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };
  
  const getSourceIcon = (source) => {
    if (source === 'Hospital') return <Building2 size={12} className="inline mr-1 text-rose-500" />;
    if (source === 'GP') return <UserCircle size={12} className="inline mr-1 text-indigo-500" />;
    if (source === 'MyAgedCare') return <Building2 size={12} className="inline mr-1 text-emerald-600" />;
    return <User size={12} className="inline mr-1 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Contact Needed</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold">{referrals.filter(r => r.status === 'contacted').length}</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Phone /></div>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Assessments Due</p>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6 font-semibold">
        {['all', 'new', 'contacted', 'assessment_scheduled'].map(t => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={`pb-4 px-2 capitalize transition-all ${filter === t ? 'text-clinical-600 border-b-2 border-clinical-600 shrink-0' : 'text-slate-500 hover:text-slate-700 shrink-0'}`}
          >
            {t === 'all' ? 'All Referrals' : t === 'assessment_scheduled' ? 'Assessments' : t.replace('_', ' ')}
            {t !== 'all' && ` (${referrals.filter(r => r.status === t).length})`}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest min-w-[200px]">Client Details</th>
                <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Clinical Triaging</th>
                <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Logistics</th>
                <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredReferrals.map((ref, index) => {
                  const mockData = getMockClinicalData(ref.id, index);
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={ref.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-clinical-50 group-hover:text-clinical-600 transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-[15px]">{ref.client_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getFundingBadge(ref.funding_type)}`}>
                                {ref.funding_type || 'HCP L3'}
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">
                                {ref.dob ? `DOB: ${new Date(ref.dob).toLocaleDateString()}` : 'No DOB'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-slate-700">{mockData.service}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-medium text-slate-500">{getSourceIcon(mockData.source)} {mockData.source}</span>
                            {mockData.risk === 'Fall Risk' || mockData.risk === 'Complex Needs' ? (
                              <span className="font-bold text-rose-500 px-1.5 bg-rose-50 rounded">High Risk</span>
                            ) : (
                              <span className="text-slate-500 font-medium">Std Risk</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                            <Navigation2 size={14} className="text-slate-400" /> {mockData.distance} from office
                          </div>
                          <p className="text-xs text-slate-400 ml-5">{ref.service_area || 'Hobart Suburbs'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {ref.status === 'new' && (
                          <div className="flex justify-end gap-2">
                            <button disabled={actionLoading === ref.id} onClick={(e) => { e.stopPropagation(); updateStatus(ref.id, 'contacted'); }} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5">
                              <Phone size={14} /> Call Client
                            </button>
                            <button disabled={actionLoading === ref.id} onClick={(e) => { e.stopPropagation(); updateStatus(ref.id, 'declined'); }} className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5">
                              <XCircle size={14} /> Decline
                            </button>
                          </div>
                        )}
                        {ref.status === 'contacted' && (
                          <div className="flex justify-end gap-2">
                            <button disabled={actionLoading === ref.id} onClick={(e) => { e.stopPropagation(); updateStatus(ref.id, 'assessment_scheduled'); }} className="px-3 py-1.5 bg-clinical-50 hover:bg-clinical-100 text-clinical-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5">
                              <Calendar size={14} /> Schedule Assess
                            </button>
                          </div>
                        )}
                        {ref.status === 'assessment_scheduled' && (
                          <div className="flex justify-end gap-2">
                            <button disabled={actionLoading === ref.id} onClick={(e) => { e.stopPropagation(); updateStatus(ref.id, 'accepted'); }} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Accept Client
                            </button>
                          </div>
                        )}
                        {['accepted', 'declined'].includes(ref.status) && (
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            ref.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {ref.status}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredReferrals.length === 0 && !loading && (
          <div className="p-16 text-center text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">No referrals pending in this group.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboard;
