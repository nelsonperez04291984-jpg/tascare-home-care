import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Users, 
  Briefcase, 
  Shield, 
  Save, 
  Globe, 
  MapPin, 
  Plus, 
  Trash2, 
  Loader2, 
  Settings2,
  CheckCircle2,
  Phone,
  Mail,
  AlertCircle,
  RefreshCw,
  Award,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  X,
  Clock,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVICE_OPTIONS = [
  'Personal Care', 'Nursing Care', 'Community Access', 
  'Domestic Assistance', 'Transport', 'Meal Preparation',
  'Medication Prompting', 'Dementia Support'
];

const TenantSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile State
  const [tenant, setTenant] = useState({ name: '', subdomain: '', state: '' });
  
  // Staff/User States
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [qualTypes, setQualTypes] = useState([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'coordinator' });
  const [workerForm, setWorkerForm] = useState({ 
    name: '', phone: '', email: '', employment_type: 'Casual', 
    home_suburb: 'Hobart', max_travel_km: 25, has_car: true,
    services: [], // Array of service names
    qualifications: [] // Array of { type_id, expiry_date, verified }
  });
  
  // Availability state
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [tempAvailability, setTempAvailability] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, uRes, wRes, qRes] = await Promise.all([
        axios.get('/api/admin/tenant'),
        axios.get('/api/admin/users'),
        axios.get('/api/care-scheduling/workers'),
        axios.get('/api/admin/qualifications')
      ]);
      setTenant(tRes.data);
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

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch('/api/admin/tenant', tenant);
      alert('✅ Organization settings updated successfully!');
    } catch (e) {
      console.error('Update Tenant Error:', e);
      const msg = e.response?.data?.detail || e.response?.data?.error || e.message;
      alert(`❌ Update Failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/admin/users', { ...userForm });
      alert(`✅ System user "${userForm.name}" created successfully!`);
      setIsAddingUser(false);
      setUserForm({ name: '', email: '', password: '', role: 'coordinator' });
      fetchData();
    } catch (e) { 
      console.error('Add User Error:', e);
      const msg = e.response?.data?.detail || e.response?.data?.error || e.message;
      alert(`❌ User Creation Failed: ${msg}`);
    }
    setSaving(false);
  };

  const handleRepair = async () => {
    setSaving(true);
    try {
      const res = await axios.get('/api/admin/repair');
      alert(`${res.data.message}\n\n${res.data.detail || ''}`);
      fetchData();
    } catch (e) {
      console.error('Repair Error:', e);
      const msg = e.response?.data?.detail || e.response?.data?.error || e.message;
      alert(`❌ Repair failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post('/api/admin/workers', { 
        ...workerForm
      });
      alert(`✅ Support worker "${response.data.name}" registered successfully!`);
      setIsAddingWorker(false);
      setOnboardingStep(1);
      setWorkerForm({ 
        name: '', phone: '', email: '', employment_type: 'Casual', 
        home_suburb: 'Hobart', max_travel_km: 25, has_car: true,
        services: [], qualifications: []
      });
      fetchData();
    } catch (e) { 
      console.error('Add Worker Error:', e);
      const msg = e.response?.data?.detail || e.response?.data?.error || e.message;
      alert(`❌ Registration Failed: ${msg}`);
    }
    setSaving(false);
  };
  
  const openAvailability = async (worker) => {
    setSelectedWorker(worker);
    try {
      const res = await axios.get(`/api/care-scheduling/workers/${worker.id}/availability`);
      // Ensure we have all 7 days represented
      const days = [0,1,2,3,4,5,6].map(d => {
        const existing = res.data.find(r => r.day_of_week === d);
        return existing || { day_of_week: d, start_time: '09:00', end_time: '17:00', active: false };
      });
      setTempAvailability(days);
      setIsAvailabilityModalOpen(true);
    } catch (e) { console.error(e); }
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/care-scheduling/workers/${selectedWorker.id}/availability`, {
        availability: tempAvailability
      });
      setIsAvailabilityModalOpen(false);
      fetchData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const copyMondayToWeekdays = () => {
    const monday = tempAvailability.find(d => d.day_of_week === 1);
    if (!monday) return;
    setTempAvailability(prev => prev.map(d => 
      (d.day_of_week >= 1 && d.day_of_week <= 5) 
        ? { ...d, start_time: monday.start_time, end_time: monday.end_time, active: monday.active } 
        : d
    ));
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteWorker = async (id) => {
    if (!window.confirm('Delete this support worker?')) return;
    try {
      await axios.delete(`/api/admin/workers/${id}`);
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Loading administrative workspace...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Operational Headquarters</h2>
        <p className="text-slate-500 italic">Global Configuration for {tenant?.name || 'TasCare'}</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'profile', label: 'Organization', icon: Building2 },
          { id: 'users', label: 'System Users', icon: Shield },
          { id: 'workers', label: 'Field Staff', icon: Briefcase }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id ? 'bg-white text-clinical-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass p-8 rounded-3xl border-white/40 shadow-xl"
        >
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateTenant} className="max-w-2xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={14}/> Agency Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={tenant?.name}
                    onChange={e => setTenant({...tenant, name: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-clinical-50 shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings2 size={14}/> Subdomain Identifier
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      required
                      value={tenant?.subdomain}
                      onChange={e => setTenant({...tenant, subdomain: e.target.value})}
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-clinical-50 shadow-sm" 
                    />
                    <span className="text-xs font-bold text-slate-400">.tascare.com</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14}/> Operational State
                  </label>
                  <select 
                    value={tenant?.state}
                    onChange={e => setTenant({...tenant, state: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-clinical-50 shadow-sm"
                  >
                    <option value="Tasmania">Tasmania</option>
                    <option value="New South Wales">New South Wales</option>
                    <option value="Victoria">Victoria</option>
                    <option value="Queensland">Queensland</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-400 max-w-sm">
                  Updating these settings will adjust the reporting labels and headers across the entire platform.
                </div>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="clinical-btn-primary flex items-center gap-2 px-8"
                >
                  <Save size={20} />
                  <span>{saving ? 'Persisting...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-slate-800">Access Management Registry</h3>
                <button onClick={() => setIsAddingUser(!isAddingUser)} className="clinical-btn-outline flex items-center gap-2 text-sm">
                  <Plus size={18} /> New System User
                </button>
              </div>

              {isAddingUser && (
                <motion.form initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} onSubmit={handleAddUser} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name" required className="p-3 rounded-xl border text-sm" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                    <input type="email" placeholder="Email Address" required className="p-3 rounded-xl border text-sm" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                    <input type="password" placeholder="Password" required className="p-3 rounded-xl border text-sm" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                    <select className="p-3 rounded-xl border text-sm bg-white font-semibold" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                      <option value="coordinator">Coordinator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-sm font-bold text-slate-400">Dismiss</button>
                    <button type="submit" disabled={saving} className="clinical-btn-primary px-6 py-2 text-sm">Create Login</button>
                  </div>
                </motion.form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-clinical-100 text-clinical-700'}`}>
                        {u.role}
                      </span>
                      <button onClick={() => deleteUser(u.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORKERS TAB */}
          {activeTab === 'workers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-slate-800">Support Personnel Registry</h3>
                <div className="flex gap-3">
                  <button 
                    onClick={handleRepair} 
                    disabled={saving}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-clinical-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
                  >
                    <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
                    <span>{saving ? 'Repairing...' : 'Sync & Repair'}</span>
                  </button>
                  {!isAddingWorker && (
                    <button onClick={() => setIsAddingWorker(true)} className="clinical-btn-primary flex items-center gap-2 text-sm px-6">
                      <Plus size={18} /> New Support Worker
                    </button>
                  )}
                </div>
              </div>

              {isAddingWorker ? (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h4 className="text-xl font-black text-slate-800">Staff Onboarding</h4>
                      <p className="text-slate-500 text-sm font-medium">Step {onboardingStep} of 4: {['Identity', 'Geography', 'Authorization', 'Compliance'][onboardingStep-1]}</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${onboardingStep >= s ? 'bg-clinical-500' : 'bg-slate-200'}`}></div>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-[320px]">
                    {/* STEP 1: IDENTITY */}
                    {onboardingStep === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                          <input type="text" required value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-clinical-500 outline-none" placeholder="Sarah Collins"/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employment Type</label>
                          <select value={workerForm.employment_type} onChange={e => setWorkerForm({...workerForm, employment_type: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-200 bg-white">
                            <option value="Casual">Casual</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Full-time">Full-time</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                          <input type="text" value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-200" placeholder="0400 000 000"/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                          <input type="email" value={workerForm.email} onChange={e => setWorkerForm({...workerForm, email: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-200" placeholder="sarah@example.com"/>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: GEOGRAPHY */}
                    {onboardingStep === 2 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Home Base Suburb</label>
                            <select value={workerForm.home_suburb} onChange={e => setWorkerForm({...workerForm, home_suburb: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-200 bg-white">
                              {['Hobart', 'Kingston', 'Glenorchy', 'Bellerive', 'Sandy Bay', 'Taroona'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Travel Radius ({workerForm.max_travel_km}km)</label>
                            <input type="range" min="5" max="100" step="5" value={workerForm.max_travel_km} onChange={e => setWorkerForm({...workerForm, max_travel_km: parseInt(e.target.value)})} className="w-full accent-clinical-500 mt-4"/>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                              <span>Local (5km)</span>
                              <span>Regional (100km)</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border border-slate-200 flex items-center gap-6 shadow-sm">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${workerForm.has_car ? 'bg-clinical-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                            <Briefcase size={24}/>
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-slate-800">Transportation Capability</p>
                            <p className="text-sm text-slate-500 font-medium">Worker has a registered, insured vehicle for shifts.</p>
                          </div>
                          <button type="button" onClick={() => setWorkerForm({...workerForm, has_car: !workerForm.has_car})} className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${workerForm.has_car ? 'bg-clinical-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {workerForm.has_car ? 'Yes' : 'No'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: AUTHORIZATION */}
                    {onboardingStep === 3 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {SERVICE_OPTIONS.map(service => (
                          <button 
                            key={service} 
                            type="button" 
                            onClick={() => toggleService(service)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${workerForm.services.includes(service) ? 'border-clinical-500 bg-clinical-50 text-clinical-800' : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <CheckCircle2 size={16} className={workerForm.services.includes(service) ? 'text-clinical-500' : 'text-transparent'}/>
                            </div>
                            <span className="font-bold text-sm leading-tight">{service}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* STEP 4: COMPLIANCE */}
                    {onboardingStep === 4 && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {qualTypes.map(q => {
                          const selection = workerForm.qualifications.find(sel => sel.type_id === q.id);
                          return (
                            <div key={q.id} className={`p-4 rounded-2xl border ${selection ? 'border-clinical-200 bg-white shadow-sm' : 'border-slate-200 bg-white/50 opacity-60'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <ClipboardCheck className={q.is_mandatory ? "text-rose-500" : "text-blue-500"} size={20}/>
                                  <div>
                                    <p className="font-black text-slate-800 leading-tight text-sm uppercase tracking-tight">{q.name}</p>
                                    {q.is_government_locked && <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter">GOVT LOCKED</span>}
                                  </div>
                                </div>
                                <input type="checkbox" checked={!!selection} onChange={e => e.target.checked ? handleQualChange(q.id, 'verified', true) : setWorkerForm({...workerForm, qualifications: workerForm.qualifications.filter(sel => sel.type_id !== q.id)})} className="w-5 h-5 rounded accent-clinical-600"/>
                              </div>
                              {selection && (
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Expiry Date</label>
                                    <input type="date" value={selection.expiry_date || ''} onChange={e => handleQualChange(q.id, 'expiry_date', e.target.value)} className="w-full p-2 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-clinical-500"/>
                                  </div>
                                  <div className="flex items-end pb-1 gap-2">
                                    <ShieldCheck className="text-emerald-500" size={16}/>
                                    <span className="text-[9px] font-black text-emerald-600 uppercase">Verified on sight</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-200 flex justify-between items-center">
                    <button type="button" onClick={() => onboardingStep === 1 ? setIsAddingWorker(false) : setOnboardingStep(onboardingStep - 1)} className="px-6 py-2 font-bold text-slate-400 hover:text-slate-600 transition-colors">
                      {onboardingStep === 1 ? 'Cancel Onboarding' : 'Previous Step'}
                    </button>
                    {onboardingStep < 4 ? (
                      <button type="button" onClick={() => setOnboardingStep(onboardingStep + 1)} className="clinical-btn-primary flex items-center gap-2 px-10 py-3 group">
                        Next Phase <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                      </button>
                    ) : (
                      <button onClick={handleAddWorker} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-12 py-3 font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:grayscale">
                        {saving ? 'Registering...' : 'Finalize Registration'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workers.map(w => (
                    <div key={w.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden p-6">
                      <div className={`absolute left-0 top-0 h-full w-1.5 ${w.is_compliant === false ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-clinical-50 group-hover:text-clinical-600 transition-colors">
                            <Briefcase size={26} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-lg leading-tight">{w.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] font-black text-clinical-600 uppercase tracking-widest">{w.employment_type}</p>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${w.has_availability ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                  {w.has_availability ? 'Available' : 'Offline'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => deleteWorker(w.id)} className="text-slate-200 hover:text-rose-500 transition-colors p-2">
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {!w.has_availability && (
                        <div className="mb-4 p-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase">
                          <AlertCircle size={14}/>
                          No availability configured
                        </div>
                      )}

                      <div className="space-y-2 mb-6">
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                           <MapPin size={12} className="text-slate-300"/> {w.home_suburb || 'Region Home'}
                         </div>
                         <div className="flex items-center gap-2 text-xs font-bold">
                            <ShieldCheck size={12} className={w.is_compliant === false ? 'text-rose-500' : 'text-emerald-500'}/>
                            <span className={w.is_compliant === false ? 'text-rose-600' : 'text-emerald-600 uppercase tracking-tight'}>
                              {w.is_compliant === false ? 'Audit Risk' : 'Compliant'}
                            </span>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex justify-end">
                        <button 
                          onClick={() => openAvailability(w)}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-clinical-600 hover:text-clinical-700 transition-colors group"
                        >
                          Manage Availability <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isAvailabilityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black">Manage Availability</h3>
                  <p className="text-slate-400 text-xs">Configure weekly shift pattern for {selectedWorker?.name}</p>
                </div>
                <button onClick={() => setIsAvailabilityModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20}/>
                </button>
              </div>

              <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <p className="text-sm font-bold text-slate-500">Define active working hours for each day:</p>
                    <button 
                      onClick={copyMondayToWeekdays}
                      className="text-[10px] font-black uppercase tracking-widest text-clinical-600 hover:bg-clinical-50 px-3 py-1.5 rounded-lg transition-colors border border-clinical-100"
                    >
                      Copy Monday to Weekdays
                    </button>
                 </div>

                 <div className="space-y-3">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => {
                      const day = tempAvailability.find(d => d.day_of_week === idx) || { active: false };
                      return (
                        <div key={dayName} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${day.active ? 'border-clinical-200 bg-clinical-50/30' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                           <div className="w-24">
                              <label className="flex items-center gap-3 cursor-pointer group">
                                 <input 
                                   type="checkbox" 
                                   checked={day.active} 
                                   onChange={e => {
                                     const updated = [...tempAvailability];
                                     const dIdx = updated.findIndex(d => d.day_of_week === idx);
                                     updated[dIdx] = { ...updated[dIdx], active: e.target.checked };
                                     setTempAvailability(updated);
                                   }}
                                   className="w-5 h-5 rounded-md accent-clinical-600"
                                 />
                                 <span className={`text-sm font-bold ${day.active ? 'text-slate-800' : 'text-slate-400'}`}>{dayName}</span>
                              </label>
                           </div>
                           
                           <div className={`flex-1 flex items-center gap-4 transition-all ${day.active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                              <div className="flex-1 flex items-center gap-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase">Starts</span>
                                 <input 
                                   type="time" 
                                   value={day.start_time?.substring(0,5) || '09:00'} 
                                   onChange={e => {
                                     const updated = [...tempAvailability];
                                     const dIdx = updated.findIndex(d => d.day_of_week === idx);
                                     updated[dIdx] = { ...updated[dIdx], start_time: e.target.value };
                                     setTempAvailability(updated);
                                   }}
                                   className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-clinical-500"
                                 />
                              </div>
                              <div className="flex-1 flex items-center gap-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase">Ends</span>
                                 <input 
                                   type="time" 
                                   value={day.end_time?.substring(0,5) || '17:00'} 
                                   onChange={e => {
                                     const updated = [...tempAvailability];
                                     const dIdx = updated.findIndex(d => d.day_of_week === idx);
                                     updated[dIdx] = { ...updated[dIdx], end_time: e.target.value };
                                     setTempAvailability(updated);
                                   }}
                                   className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-clinical-500"
                                 />
                              </div>
                           </div>
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                 <button 
                   onClick={() => setIsAvailabilityModalOpen(false)}
                   className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={saveAvailability}
                   disabled={saving}
                   className="bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl px-8 py-2.5 font-bold text-sm shadow-lg shadow-clinical-200 transition-all active:scale-95 disabled:grayscale"
                 >
                   {saving ? 'Saving...' : 'Save Shift Pattern'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TenantSettings;
