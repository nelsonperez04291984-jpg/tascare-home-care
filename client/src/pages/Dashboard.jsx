import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ClipboardList, CheckCircle2, XCircle, Clock, Calendar, User, Phone, Navigation2, Building2, UserCircle, DownloadCloud, Stethoscope, Briefcase, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReferralDashboard = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Phase 2 States
  const [expandedRow, setExpandedRow] = useState(null);
  const [showMacModal, setShowMacModal] = useState(false);
  const [macId, setMacId] = useState('');
  const [importing, setImporting] = useState(false);

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

  // MAC Import Simulation
  const handleMacImport = async (e) => {
    e.preventDefault();
    setImporting(true);
    
    // Simulate real delay for MAC portal parsing
    setTimeout(async () => {
      try {
        await axios.post('/api/referrals', {
          tenant_id: '00000000-0000-0000-0000-000000000000',
          client_name: `MAC Import (${macId || '1-98242'})`,
          dob: '1942-05-20',
          contact_number: '0412 345 678',
          service_area: 'Launceston',
          funding_type: 'HCP LEVEL 3',
          hcp_level: 3,
          clinical_details: 'Imported clinical notes: Fall Risk. Requires walker. Services requested: General nursing, domestic assistance twice a week.',
          status: 'new'
        });
        await fetchReferrals();
        setShowMacModal(false);
        setMacId('');
      } catch(e) {
        console.error(e);
      }
      setImporting(false);
    }, 1500);
  };

  const filteredReferrals = referrals.filter(ref => filter === 'all' || ref.status === filter);

  // Simulated AI Mappings for lack of actual clinical fields
  const getMockClinicalData = (id, index) => {
    const risks = ['Fall Risk', 'Dementia Risk', 'Low Risk', 'Complex Needs', 'Social Isolation'];
    const distances = ['1.2km', '4.5km', '12km', '6km', '8.5km'];
    const servicesList = ['Nursing + Personal Care', 'Domestic Assistance', 'Allied Health', 'Respite Care', 'Transport'];
    const sources = ['Hospital', 'GP', 'MyAgedCare', 'Family', 'Hospital'];
    
    return {
      risk: risks[index % risks.length],
      distance: distances[index % distances.length],
      service: servicesList[index % servicesList.length],
      source: refIsMac(id) ? 'MyAgedCare' : sources[index % sources.length],
      diagnosis: index % 2 === 0 ? 'Osteoarthritis, Type 2 Diabetes' : 'Early stage Alzheimer’s, Hypertension',
      mobility: index % 2 === 0 ? 'Independent with 4-wheel walker' : 'Requires assistance, high fall risk',
      servicesArr: ['Nursing (1hr/wk)', 'Domestic Assistance (2hr/wk)', 'Personal Care (daily)'],
      budget: '$12,450.00'
    };
  };

  const refIsMac = (id) => false; // Just a stub

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
    <div className="space-y-6 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Referral Triage Queue</h2>
          <p className="text-slate-500">Managing intake for Tasmania (South)</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input type="text" placeholder="Search client name..." className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 outline-none w-64 bg-white shadow-sm" />
          </div>
          <button className="clinical-btn-outline flex items-center gap-2 bg-white">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          {/* Phase 2: MAC Import Button */}
          <button onClick={() => setShowMacModal(true)} className="px-4 py-2 bg-clinical-600 hover:bg-clinical-500 text-white rounded-lg flex items-center gap-2 font-bold transition-all shadow-md">
            <DownloadCloud size={18} /> Import MAC Referral
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
                <th className="px-5 py-4 w-8"></th>
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
                  const isExpanded = expandedRow === ref.id;
                  
                  return (
                    <React.Fragment key={ref.id}>
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setExpandedRow(isExpanded ? null : ref.id)}
                        className={`transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-5 py-4 text-slate-400">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </td>
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
                      
                      {/* Phase 2: Expanded Client Intelligence Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-50 border-b border-slate-200"
                          >
                            <td colSpan="5" className="p-0">
                              <div className="p-6 md:pl-20 md:pr-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-slate-200/50">
                                
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-1"><Stethoscope size={16} className="text-clinical-500" /> Clinical Diagnosis</h4>
                                    <p className="text-slate-600">{mockData.diagnosis}</p>
                                  </div>
                                  <div>
                                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-1"><UserCircle size={16} className="text-clinical-500" /> Mobility</h4>
                                    <p className="text-slate-600">{mockData.mobility}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2"><ClipboardList size={16} className="text-indigo-500" /> Services Requested</h4>
                                  <ul className="space-y-1.5">
                                    {mockData.servicesArr.map((s, i) => (
                                      <li key={i} className="flex items-center gap-2 text-slate-600">
                                        <CheckCircle2 size={14} className="text-green-500" /> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                  <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-1"><Briefcase size={16} className="text-blue-500" /> Funding Profile</h4>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-slate-500"><span className="uppercase text-[11px] tracking-wider">Package</span> <span className="font-bold text-slate-800">{ref.funding_type || 'HCP L3'}</span></div>
                                    <div className="flex justify-between text-slate-500"><span className="uppercase text-[11px] tracking-wider">Balance</span> <span className="font-bold text-blue-600">{mockData.budget}</span></div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Action</span>
                                    <p className="text-xs font-semibold mt-1">Accept immediately. Margin fits budget profile perfectly.</p>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
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

      {/* MAC Import Modal */}
      <AnimatePresence>
        {showMacModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-emerald-50">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                  <DownloadCloud size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">MyAgedCare Assessor Portal</h3>
                  <p className="text-xs text-slate-500 font-medium">Instant Integration Link</p>
                </div>
              </div>
              <form onSubmit={handleMacImport} className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Paste the MyAgedCare Referral ID below to automatically pull client packet details into your queue.</p>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">MAC Referral ID</label>
                  <input required autoFocus value={macId} onChange={e => setMacId(e.target.value)} type="text" placeholder="e.g. 1-98242" className="w-full border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                {importing && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <Activity className="animate-spin" size={18} /> Syncing records with government portal...
                  </div>
                )}
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowMacModal(false)} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                  <button disabled={importing} type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors">Pull Referral</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ReferralDashboard;
