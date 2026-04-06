import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Users, ClipboardList, Activity, Calendar } from 'lucide-react';

// Components
import Dashboard from './pages/Dashboard';
import PublicReferral from './pages/PublicReferral';
import CarePlanBuilder from './pages/CarePlanBuilder';
import SchedulingDashboard from './pages/SchedulingDashboard';

const Navigation = () => (
  <nav className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 hidden md:block">
    <div className="flex items-center gap-3 mb-12 px-2">
      <div className="w-10 h-10 bg-clinical-500 rounded-xl flex items-center justify-center rotate-3 shadow-lg">
        <Activity className="text-white" size={24} />
      </div>
      <div>
        <h1 className="font-bold text-lg leading-tight">TasCare</h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Intake & Management</p>
      </div>
    </div>

    <div className="space-y-2">
      <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </Link>
      <Link to="/referrals" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
        <ClipboardList size={20} />
        <span>Referrals</span>
      </Link>
      <Link to="/scheduling" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
        <Calendar size={20} />
        <span>Scheduling</span>
      </Link>
      <Link to="/clients" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
        <Users size={20} />
        <span>Clients</span>
      </Link>
      <Link to="/public-referral" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
        <FilePlus size={20} />
        <span>New Referral (Public)</span>
      </Link>
    </div>

    <div className="absolute bottom-10 left-6 right-6">
      <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
        <p className="text-xs text-slate-400 mb-1">Region</p>
        <p className="text-sm font-semibold text-clinical-400">Tasmania (South)</p>
      </div>
    </div>
  </nav>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen flex">
        <Navigation />
        <main className="flex-1 md:ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/public-referral" element={<PublicReferral />} />
            <Route path="/referrals" element={<Dashboard />} />
            <Route path="/care-plan/:clientId" element={<CarePlanBuilder />} />
            <Route path="/scheduling" element={<SchedulingDashboard />} />
            <Route path="/clients" element={<div className="text-2xl font-bold p-12 glass rounded-2xl">Client Directory (Coming Soon)</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
