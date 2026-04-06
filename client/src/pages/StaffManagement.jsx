import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, Shield, Briefcase, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingWorker, setIsAddingWorker] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'coordinator' });
  const [workerForm, setWorkerForm] = useState({ name: '', qualifications: '', service_areas: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, wRes] = await Promise.all([
        axios.get(`/api/admin/users?tenant_id=${TENANT_ID}`),
        axios.get(`/api/care-scheduling/workers?tenant_id=${TENANT_ID}`) // Reuse existing worker query
      ]);
      setUsers(uRes.data);
      setWorkers(wRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Staff Management</h2>
          <p className="text-slate-500">Manage system access and field support workers.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 font-medium capitalize transition-all ${activeTab === 'users' ? 'text-clinical-600 border-b-2 border-clinical-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ShieldCore className="inline mr-2" size={18} /> System Users
        </button>
        <button 
          onClick={() => setActiveTab('workers')}
          className={`pb-4 px-2 font-medium capitalize transition-all ${activeTab === 'workers' ? 'text-clinical-600 border-b-2 border-clinical-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Briefcase className="inline mr-2" size={18} /> Support Workers
        </button>
      </div>

      <div className="glass rounded-2xl border border-white/40 shadow-xl overflow-hidden p-6 bg-white/50">
        
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">System Users ({users.length})</h3>
              <button onClick={() => setIsAddingUser(!isAddingUser)} className="clinical-btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus size={16} /> Add User
              </button>
            </div>

            {isAddingUser && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAddUser} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 mb-4">
                <h4 className="font-bold text-sm text-slate-700 uppercase tracking-widest">New System User</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name" required className="p-3 rounded-lg border text-sm" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" required className="p-3 rounded-lg border text-sm" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                  <input type="password" placeholder="Password" required className="p-3 rounded-lg border text-sm" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  <select className="p-3 rounded-lg border text-sm bg-white" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button>
                  <button type="submit" disabled={saving} className="clinical-btn-primary px-4 py-2 text-sm">{saving ? 'Saving...' : 'Save User'}</button>
                </div>
              </motion.form>
            )}

            {loading ? <div className="p-8 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></div> : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50 bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500"><User size={20} /></div>
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                      <button onClick={() => deleteUser(u.id)} className="text-slate-400 hover:text-rose-500 p-2"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORKERS TAB */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Support Workers ({workers.length})</h3>
              <button onClick={() => setIsAddingWorker(!isAddingWorker)} className="clinical-btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus size={16} /> Add Worker
              </button>
            </div>

            {isAddingWorker && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAddWorker} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 mb-4">
                <h4 className="font-bold text-sm text-slate-700 uppercase tracking-widest">New Support Worker</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name" required className="p-3 rounded-lg border text-sm" value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} />
                  <input type="text" placeholder="Qualifications (e.g. Cert III in Individual Support)" className="p-3 rounded-lg border text-sm" value={workerForm.qualifications} onChange={e => setWorkerForm({...workerForm, qualifications: e.target.value})} />
                  <div className="col-span-2">
                    <input type="text" placeholder="Service Areas (comma separated, e.g. Hobart, Glenorchy)" className="w-full p-3 rounded-lg border text-sm" value={workerForm.service_areas} onChange={e => setWorkerForm({...workerForm, service_areas: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingWorker(false)} className="px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button>
                  <button type="submit" disabled={saving} className="clinical-btn-primary px-4 py-2 text-sm">{saving ? 'Saving...' : 'Save Worker'}</button>
                </div>
              </motion.form>
            )}

            {loading ? <div className="p-8 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></div> : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {workers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-4 hover:bg-slate-50 bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><Briefcase size={20} /></div>
                      <div>
                        <p className="font-bold text-slate-800">{w.name}</p>
                        <p className="text-xs text-slate-500">{w.qualifications || 'No qualifications listed'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-xs text-slate-500 max-w-[200px] truncate">{(w.service_areas || []).join(', ') || 'All areas'}</p>
                      <button onClick={() => deleteWorker(w.id)} className="text-slate-400 hover:text-rose-500 p-2"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffManagement;
