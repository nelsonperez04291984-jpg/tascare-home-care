import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Users, ClipboardList, Activity, Calendar, Shield, LogOut, PiggyBank, Settings, TrendingUp } from 'lucide-react';
import axios from 'axios';

// Components
import Dashboard from './pages/Dashboard';
import PublicReferral from './pages/PublicReferral';
import CarePlanBuilder from './pages/CarePlanBuilder';
import SchedulingDashboard from './pages/SchedulingDashboard';
import HomeDashboard from './pages/HomeDashboard';
import StaffManagement from './pages/StaffManagement';
import BillingDashboard from './pages/BillingDashboard';
import TenantSettings from './pages/TenantSettings';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Login from './pages/Login';

const NavLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        active ? 'bg-clinical-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Navigation = ({ currentUser, onLogout, tenant }) => (
  <nav className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col">
    <div className="flex items-center gap-3 mb-12 px-2">
      <div className="w-10 h-10 bg-clinical-500 rounded-xl flex items-center justify-center rotate-3 shadow-lg">
        <Activity className="text-white" size={24} />
      </div>
      <div>
        <h1 className="font-bold text-lg leading-tight">{tenant?.name || 'TasCare'}</h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Intake & Management</p>
      </div>
    </div>

    <div className="space-y-1 flex-1">
      <NavLink to="/" icon={LayoutDashboard} label="Overview" />
      <NavLink to="/referrals" icon={ClipboardList} label="Referrals" />
      <NavLink to="/scheduling" icon={Calendar} label="Scheduling" />
      <NavLink to="/billing" icon={PiggyBank} label="Invoicing" />
      <NavLink to="/analytics" icon={TrendingUp} label="Analytics" />
      <NavLink to="/clients" icon={Users} label="Clients" />
      <NavLink to="/public-referral" icon={FilePlus} label="New Referral" />
      {currentUser?.role === 'admin' && <NavLink to="/settings" icon={Settings} label="Admin Settings" />}
    </div>

    <div className="mt-auto">
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-200">{currentUser?.name}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">{currentUser?.role}</span>
        </div>
        <button onClick={onLogout} title="Log Out" className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
          <LogOut size={18} />
        </button>
      </div>

      <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
        <p className="text-xs text-slate-400 mb-1">Region</p>
        <p className="text-sm font-semibold text-clinical-400">{tenant?.state || 'Tasmania'}</p>
      </div>
    </div>
  </nav>
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);

  const fetchBranding = async () => {
    try {
      // Backend now resolves tenant from JWT session
      const res = await axios.get('/api/admin/tenant');
      setTenant(res.data);
    } catch (e) { 
      console.error('Branding fetch failed:', e); 
    }
  };

  useEffect(() => {
    // Check Local Storage on mount
    const token = localStorage.getItem('tascare_token');
    const userStr = localStorage.getItem('tascare_user');
    if (token && userStr) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(JSON.parse(userStr));
      fetchBranding();
    }
    setLoading(false);
  }, []);

  const handleLogin = (user, token) => {
    localStorage.setItem('tascare_token', token);
    localStorage.setItem('tascare_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setCurrentUser(user);
    // Branding fetch will happen naturally or can be called here
    fetchBranding();
  };

  const handleLogout = () => {
    localStorage.removeItem('tascare_token');
    localStorage.removeItem('tascare_user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setTenant(null);
  };

  if (loading) return null;

  return (
    <Router>
      <div className="min-h-screen flex">
        {currentUser ? (
           <>
            <Navigation currentUser={currentUser} onLogout={handleLogout} tenant={tenant} />
            <main className="flex-1 md:ml-64 p-8">
              <Routes>
                <Route path="/" element={<HomeDashboard />} />
                <Route path="/referrals" element={<Dashboard />} />
                <Route path="/care-plan/:clientId" element={<CarePlanBuilder />} />
                <Route path="/scheduling" element={<SchedulingDashboard />} />
                <Route path="/billing" element={<BillingDashboard />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/public-referral" element={<PublicReferral />} />
                {currentUser.role === 'admin' && (
                  <>
                    <Route path="/staff" element={<StaffManagement />} />
                    <Route path="/settings" element={<TenantSettings />} />
                  </>
                )}
                <Route path="/clients" element={<div className="text-2xl font-bold p-12 glass rounded-2xl">Client Directory (Coming Soon)</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
           </>
        ) : (
          <Routes>
            <Route path="/public-referral" element={<PublicReferral />} />
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;

