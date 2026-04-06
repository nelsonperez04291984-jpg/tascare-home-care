import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  User, Shield, Briefcase, Plus, Trash2, Loader2, CheckCircle2, 
  MapPin, Phone, Mail, Award, ClipboardCheck, AlertCircle, 
  ShieldCheck, ArrowRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const SERVICE_OPTIONS = [
  'Personal Care', 'Nursing Care', 'Community Access', 
  'Domestic Assistance', 'Transport', 'Meal Preparation',
  'Medication Prompting', 'Dementia Support'
];

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('workers');
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [qualTypes, setQualTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Form states
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'coordinator' });
  const [workerForm, setWorkerForm] = useState({ 
    name: '', phone: '', email: '', employment_type: 'Casual', 
    home_suburb: 'Hobart', max_travel_km: 25, has_car: true,
    services: [], // Array of service names
    qualifications: [] // Array of { type_id, expiry_date, verified }
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, wRes, qRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/care-scheduling/workers'),
        axios.get('/api/admin/qualifications')
      ]);
      setUsers(uRes.data);
      setWorkers(wRes.data);
      setQualTypes(qRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleService = (service) => {
    setWorkerForm(prev => ({
      ...prev,
      services: prev.services.includes(service) 
        ? prev.services.filter(s => s !== service) 
        : [...prev.services, service]
    }));
  };

  const handleQualChange = (typeId, field, value) => {
    setWorkerForm(prev => {
      const existing = prev.qualifications.find(q => q.type_id === typeId);
      if (existing) {
        return {
          ...prev,
          qualifications: prev.qualifications.map(q => q.type_id === typeId ? { ...q, [field]: value } : q)
        };
      } else {
        return {
          ...prev,
          qualifications: [...prev.qualifications, { type_id: typeId, [field]: value, verified: true }]
        };
      }
    });
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/admin/workers', { 
        ...workerForm
      });
      setIsAddingWorker(false);
      setOnboardingStep(1);
      setWorkerForm({ 
        name: '', phone: '', email: '', employment_type: 'Casual', 
        home_suburb: 'Hobart', max_travel_km: 25, has_car: true,
        services: [], qualifications: []
      });
      fetchData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const deleteWorker = async (id) => {
    if (!window.confirm('Delete this support worker?')) return;
    try {
      await axios.delete(`/api/admin/workers/${id}`);
      fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Staff & Compliance</h2>
          <p className="text-slate-500">Manage system access, workforce onboarding, and clinical compliance.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setIsAddingWorker(true)} className="clinical-btn-primary flex items-center gap-2 px-6 py-2.5">
             <Plus size={18} /> Onboard Staff
           </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('workers')}
          className={`pb-4 px-2 font-bold transition-all ${activeTab === 'workers' ? 'text-clinical-600 border-b-2 border-clinical-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Briefcase className="inline mr-2" size={18} /> Support Workforce
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 font-bold transition-all ${activeTab === 'users' ? 'text-clinical-600 border-b-2 border-clinical-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Shield className="inline mr-2" size={18} /> System Access
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* WORKERS LIST VIEW */}
        {activeTab === 'workers' && !isAddingWorker && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? <div className="col-span-full py-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></div> : (
              workers.map(w => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={w.id} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 relative group overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${w.compliance_status === 'compliant' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-clinical-50 group-hover:text-clinical-600 transition-colors">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg leading-tight">{w.name}</p>
                        <p className="text-xs font-bold text-clinical-600 uppercase tracking-wider">{w.employment_type}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteWorker(w.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400"/>
                      <span>{w.home_suburb || 'Not set'} <span className="text-slate-400 font-medium">({w.max_travel_km}km radius)</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} className="text-slate-400"/>
                      <span>{w.email || 'No email'}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {(w.service_areas || []).slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase">{s}</span>
                    ))}
                    {w.service_areas?.length > 3 && <span className="text-[10px] text-slate-400 font-bold self-center">+{w.service_areas.length - 3}</span>}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={16} className={w.compliance_status === 'compliant' ? 'text-emerald-500' : 'text-rose-500'}/>
                       <span className={`text-xs font-black uppercase tracking-widest ${w.compliance_status === 'compliant' ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {w.compliance_status === 'compliant' ? 'Compliant' : 'Audit Risk'}
                       </span>
                    </div>
                    <div className="flex items-center gap-1.5 grayscale opacity-50">
                      {w.has_car && <Briefcase size={14} title="Has Car"/>}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ONBOARDING WIZARD */}
        {isAddingWorker && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl mx-auto overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Staff Onboarding</h3>
                <p className="text-slate-400 text-sm">Step {onboardingStep} of 4: {['Identity', 'Geography', 'Authorization', 'Compliance'][onboardingStep-1]}</p>
              </div>
              <button onClick={() => setIsAddingWorker(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24}/>
              </button>
            </div>

            <div className="p-8">
              {/* Progress Bar */}
              <div className="flex gap-2 mb-10">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-2 flex-1 rounded-full transition-all ${onboardingStep >= s ? 'bg-clinical-500' : 'bg-slate-100'}`}></div>
                ))}
              </div>

              <form onSubmit={handleAddWorker} className="min-h-[300px]">
                
                {/* STEP 1: IDENTITY */}
                {onboardingStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                        <input type="text" required value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clinical-500 outline-none transition-all" placeholder="Sarah Collins"/>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Employment Type</label>
                         <select value={workerForm.employment_type} onChange={e => setWorkerForm({...workerForm, employment_type: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clinical-500 outline-none transition-all bg-white cursor-pointer">
                            <option value="Casual">Casual</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Contractor">Contractor</option>
                         </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Phone</label>
                        <input type="text" value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clinical-500 outline-none transition-all" placeholder="0400 000 000"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                        <input type="email" value={workerForm.email} onChange={e => setWorkerForm({...workerForm, email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clinical-500 outline-none transition-all" placeholder="sarah@example.com"/>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: GEOGRAPHY */}
                {onboardingStep === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Home Base Suburb</label>
                          <select value={workerForm.home_suburb} onChange={e => setWorkerForm({...workerForm, home_suburb: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-clinical-500 outline-none transition-all bg-white">
                            {['Hobart', 'Kingston', 'Glenorchy', 'Bellerive', 'Sandy Bay', 'Taroona', 'Claremont'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Max Travel Radius ({workerForm.max_travel_km}km)</label>
                          <input type="range" min="5" max="100" step="5" value={workerForm.max_travel_km} onChange={e => setWorkerForm({...workerForm, max_travel_km: parseInt(e.target.value)})} className="w-full accent-clinical-600"/>
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                            <span>Local (5km)</span>
                            <span>Regional (100km)</span>
                          </div>
                       </div>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${workerForm.has_car ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>
                        <Briefcase size={20}/>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">Transportation Capability</p>
                        <p className="text-xs text-slate-500">Worker has a registered, insured vehicle for shifts.</p>
                      </div>
                      <button type="button" onClick={() => setWorkerForm({...workerForm, has_car: !workerForm.has_car})} className={`px-6 py-2 rounded-xl font-bold transition-all ${workerForm.has_car ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {workerForm.has_car ? 'YES' : 'NO'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: AUTHORIZATION (SERVICES) */}
                {onboardingStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-sm font-bold text-slate-500">Select which clinical services this worker is authorized and competent to perform:</p>
                    <div className="grid grid-cols-2 gap-3">
                       {SERVICE_OPTIONS.map(service => (
                         <button 
                           key={service} 
                           type="button"
                           onClick={() => toggleService(service)}
                           className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${workerForm.services.includes(service) ? 'border-clinical-500 bg-clinical-50 text-clinical-700 shadow-sm' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                         >
                           <span className="font-bold">{service}</span>
                           {workerForm.services.includes(service) && <CheckCircle2 size={18}/>}
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: COMPLIANCE */}
                {onboardingStep === 4 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {qualTypes.map(q => {
                      const selection = workerForm.qualifications.find(sel => sel.type_id === q.id);
                      return (
                        <div key={q.id} className={`p-5 rounded-2xl border ${selection ? 'border-clinical-200 bg-clinical-50/50' : 'border-slate-100 bg-slate-50 opacity-80'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <ClipboardCheck className={q.is_mandatory ? "text-rose-500" : "text-blue-500"}/>
                              <div>
                                <p className="font-black text-slate-800 leading-tight">{q.name}</p>
                                {q.is_government_locked && <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter">GOVT MANDATED</span>}
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={!!selection} 
                              onChange={e => e.target.checked ? handleQualChange(q.id, 'verified', true) : setWorkerForm({...workerForm, qualifications: workerForm.qualifications.filter(sel => sel.type_id !== q.id)})}
                              className="w-6 h-6 rounded-lg accent-clinical-600 cursor-pointer"
                            />
                          </div>
                          {selection && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                               <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-500 uppercase">Expiry Date</label>
                                 <input type="date" value={selection.expiry_date || ''} onChange={e => handleQualChange(q.id, 'expiry_date', e.target.value)} className="w-full p-2 rounded-lg border text-sm font-bold outline-none focus:ring-2 focus:ring-clinical-500"/>
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-500 uppercase">Verification</label>
                                 <div className="flex items-center gap-2 h-10">
                                    <ShieldCheck className="text-emerald-500" size={18}/>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase">Verified on Sight</span>
                                 </div>
                               </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                
              </form>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
               <button 
                 type="button" 
                 disabled={onboardingStep === 1}
                 onClick={() => setOnboardingStep(s => s - 1)}
                 className="px-6 py-2.5 font-bold text-slate-400 disabled:opacity-30 hover:text-slate-600 transition-colors"
               >
                 Back
               </button>
               
               {onboardingStep < 4 ? (
                 <button 
                   type="button"
                   onClick={() => setOnboardingStep(s => s + 1)}
                   className="clinical-btn-primary flex items-center gap-2 px-8 py-3 group"
                 >
                   Next Section <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                 </button>
               ) : (
                 <button 
                   onClick={handleAddWorker}
                   disabled={saving}
                   className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-12 py-3 font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:grayscale"
                 >
                   {saving ? 'Creating...' : 'Finalize Onboarding'}
                 </button>
               )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default StaffManagement;
