import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  MapPin, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';
const COLORS = ['#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`/api/analytics/insights?tenant_id=${TENANT_ID}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Assembling operational intelligence...</div>;
  if (!data) return <div className="p-12 text-center text-rose-500">Failed to load analytics engine.</div>;

  const { summary, referralTrend, serviceMix, geographicData } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Executive Analytics</h2>
          <p className="text-slate-500 font-medium">TasCare Performance Matrix • Q2 2026</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={18} /> Last 6 Months
          </button>
          <button className="flex items-center gap-2 bg-clinical-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-clinical-700 transition-all">
            <Filter size={18} /> Detailed Report
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Monthly Revenue" 
            value={`$${parseFloat(summary.projectedRevenue).toLocaleString()}`} 
            change="+14.2%" 
            isUp={true} 
            icon={DollarSign} 
            color="text-emerald-600"
            bgColor="bg-emerald-50"
        />
        <StatCard 
            title="Active Care Plans" 
            value={summary.activeClients} 
            change="+8.1%" 
            isUp={true} 
            icon={Users} 
            color="text-clinical-600"
            bgColor="bg-clinical-50"
        />
        <StatCard 
            title="Referral Conversion" 
            value={`${summary.conversionRate}%`} 
            change="-2.4%" 
            isUp={false} 
            icon={Target} 
            color="text-indigo-600"
            bgColor="bg-indigo-50"
        />
        <StatCard 
            title="New Enquiries" 
            value={summary.newReferrals} 
            change="+22.5%" 
            isUp={true} 
            icon={TrendingUp} 
            color="text-amber-600"
            bgColor="bg-amber-50"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Pipeline - Large Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl border-white/40 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-lg">Intake Pipeline Velocity</h3>
            <div className="px-3 py-1 rounded-full bg-clinical-50 text-[10px] font-black text-clinical-600 uppercase tracking-widest border border-clinical-100">
              New Admissions
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={referralTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Mix - Pie Chart */}
        <div className="glass p-8 rounded-3xl border-white/40 shadow-xl space-y-6">
           <h3 className="font-extrabold text-slate-800 text-lg">Service Portfolio</h3>
           <div className="h-[250px] w-full relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={serviceMix}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="count"
                   nameKey="service_type"
                 >
                   {serviceMix.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total</p>
                  <p className="text-2xl font-black text-slate-800">{serviceMix.reduce((a,b) => a + b.count, 0)}</p>
                </div>
             </div>
           </div>
           <div className="space-y-3">
              {serviceMix.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-xs font-semibold text-slate-600">{s.service_type}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{s.count} visits</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Geographic Distribution - Bar Chart */}
        <div className="glass p-8 rounded-3xl border-white/40 shadow-xl space-y-6">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
               <MapPin size={24} />
             </div>
             <h3 className="font-extrabold text-slate-800 text-lg">Geographic Clinical Density</h3>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={geographicData} layout="vertical">
                 <XAxis type="number" hide />
                 <YAxis dataKey="suburb" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} width={100} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px' }} />
                 <Bar dataKey="count" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Real-time Activity Feed Simulation */}
        <div className="glass p-8 rounded-3xl border-white/40 shadow-xl space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="font-extrabold text-slate-800 text-lg">System Pulse</h3>
             <Activity className="text-clinical-500 animate-pulse" size={20} />
           </div>
           <div className="space-y-6">
              <ActivityItem 
                title="New Referral Accepted" 
                subtitle="John Smith • Hobart Region"
                time="2 mins ago" 
                dotColor="bg-emerald-500"
              />
              <ActivityItem 
                title="Care Plan Finalized" 
                subtitle="Sarah Mitchell • Level 3 HCP"
                time="45 mins ago" 
                dotColor="bg-indigo-500"
              />
              <ActivityItem 
                title="Schedule Optimization Run" 
                subtitle="24 shifts auto-routed in Kingston"
                time="2 hours ago" 
                dotColor="bg-clinical-500"
              />
               <ActivityItem 
                title="DEX Export Generated" 
                subtitle="18 valid records transmitted"
                time="5 hours ago" 
                dotColor="bg-amber-500"
              />
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, isUp, icon: Icon, color, bgColor }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-3xl border-white/40 shadow-lg relative overflow-hidden"
  >
    <div className={`p-3 rounded-2xl ${bgColor} ${color} w-fit mb-4`}>
       <Icon size={24} />
    </div>
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <div className="flex items-baseline gap-3 mt-1">
      <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
      <span className={`text-xs font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'} flex items-center`}>
        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </span>
    </div>
  </motion.div>
);

const ActivityItem = ({ title, subtitle, time, dotColor }) => (
  <div className="flex gap-4 relative">
    <div className={`w-3 h-3 rounded-full ${dotColor} mt-1 z-10 shrink-0 shadow-sm border-2 border-white`}></div>
    <div className="space-y-1">
      <p className="text-sm font-bold text-slate-800 leading-none">{title}</p>
      <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{time}</p>
    </div>
  </div>
);

export default AnalyticsDashboard;
