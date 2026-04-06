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
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';

const TenantSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile State
  const [tenant, setTenant] = useState({ name: '', subdomain: '', state: '' });
  
  // Staff/User States
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'coordinator' });
  const [workerForm, setWorkerForm] = useState({ name: '', qualifications: '', service_areas: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, uRes, wRes] = await Promise.all([
        axios.get(`/api/admin/tenant?id=${TENANT_ID}`),
        axios.get(`/api/admin/users?tenant_id=${TENANT_ID}`),
        axios.get(`/api/care-scheduling/workers?tenant_id=${TENANT_ID}`)
      ]);
      setTenant(tRes.data);
      setUsers(uRes.data);
      setWorkers(wRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`/api/admin/tenant/${TENANT_ID}`, tenant);
      alert('Organization settings updated successfully!');
      // Force reload to update sidebar branding if necessary, 
      // or just trust the local state for this view
    } catch (e) {
      console.error(e);
      alert('Failed to update organization settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/admin/users', { ...userForm, tenant_id: TENANT_ID });
      setIsAddingUser(false);
      setUserForm({ name: '', email: '', password: '', role: 'coordinator' });
      fetchData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/admin/workers', { 
        tenant_id: TENANT_ID,
        name: workerForm.name,
        qualifications: workerForm.qualifications,
        service_areas: workerForm.service_areas.split(',').map(s => s.trim()).filter(Boolean)
      });
      setIsAddingWorker(false);
      setWorkerForm({ name: '', qualifications: '', service_areas: '' });
      fetchData();
    } catch (e) { console.error(e); }
    setSaving(false);
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
                <button onClick={() => setIsAddingWorker(!isAddingWorker)} className="clinical-btn-outline flex items-center gap-2 text-sm">
                  <Plus size={18} /> New Support Worker
                </button>
              </div>

              {isAddingWorker && (
                <motion.form initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} onSubmit={handleAddWorker} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Worker Full Name" required className="p-3 rounded-xl border text-sm" value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} />
                    <input type="text" placeholder="Qualifications (e.g. Enrolled Nurse)" className="p-3 rounded-xl border text-sm" value={workerForm.qualifications} onChange={e => setWorkerForm({...workerForm, qualifications: e.target.value})} />
                    <div className="col-span-2">
                      <input type="text" placeholder="Service Areas (comma separated: Hobart, Kingston...)" className="w-full p-3 rounded-xl border text-sm" value={workerForm.service_areas} onChange={e => setWorkerForm({...workerForm, service_areas: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddingWorker(false)} className="px-4 py-2 text-sm font-bold text-slate-400">Dismiss</button>
                    <button type="submit" disabled={saving} className="clinical-btn-primary px-6 py-2 text-sm">Register Worker</button>
                  </div>
                </motion.form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{w.name}</p>
                        <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">{w.qualifications || 'Field Support'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-600">
                        {w.service_areas?.length || 0} Areas
                      </span>
                      <button onClick={() => deleteWorker(w.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TenantSettings;
