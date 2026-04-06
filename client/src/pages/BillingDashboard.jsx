import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PiggyBank, 
  DownloadCloud, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  FileText,
  Search,
  Filter,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TENANT_ID = '00000000-0000-0000-0000-000000000000';

const BillingDashboard = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const res = await axios.get(`/api/billing/summary?tenant_id=${TENANT_ID}`);
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch billing summary", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDexExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`/api/billing/export-dex?tenant_id=${TENANT_ID}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DEX_Export_TasCare.xml');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("DEX Export failed", err);
      alert("Failed to generate DEX XML. Please ensure all client data is validated.");
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = summary.reduce((acc, curr) => acc + curr.actual, 0);
  const avgUtilization = summary.length > 0 ? summary.reduce((acc, curr) => acc + curr.utilization, 0) / summary.length : 0;
  const overBudgetCount = summary.filter(s => s.utilization > 100).length;
  const readyForDex = summary.filter(s => s.isDexReady).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Billing & Invoicing Engine</h2>
          <p className="text-slate-500">Financial Oversight • Reporting Period: June 2026</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleDexExport}
            disabled={exporting}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {exporting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <TrendingUp size={20} />
              </motion.div>
            ) : <DownloadCloud size={20} />}
            <span>Export DEX XML</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border-white/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PiggyBank size={64} className="text-clinical-600" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Claimable Revenue</p>
          <h3 className="text-3xl font-black text-slate-800">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          <div className="mt-2 flex items-center text-xs font-bold text-emerald-600">
            <ArrowUpRight size={14} className="mr-1"/> 12.5% vs last month
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border-white/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Utilization</p>
          <h3 className="text-3xl font-black text-slate-800">{avgUtilization.toFixed(1)}%</h3>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(avgUtilization, 100)}%` }}></div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border-rose-100 bg-rose-50/30 shadow-sm relative overflow-hidden group border">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-rose-600">
            <AlertCircle size={64} />
          </div>
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Over Budget</p>
          <h3 className="text-3xl font-black text-rose-700">{overBudgetCount} Clients</h3>
          <p className="mt-2 text-[11px] font-semibold text-rose-600 italic">Attention required immediately</p>
        </div>

        <div className="glass p-6 rounded-2xl border-emerald-100 bg-emerald-50/30 shadow-sm relative overflow-hidden group border">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-600">
            <CheckCircle2 size={64} />
          </div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">DEX Readiness</p>
          <h3 className="text-3xl font-black text-emerald-700">{readyForDex}/{summary.length}</h3>
          <p className="mt-2 text-[11px] font-semibold text-emerald-600 italic">Data validated for government</p>
        </div>
      </div>

      {/* Main Billing Table */}
      <div className="glass rounded-3xl border-white/40 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <FileText className="text-clinical-600" size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Invoice Generation Registry</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Search client..." className="pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-clinical-400 w-48 lg:w-64" />
            </div>
            <button className="p-2 border rounded-xl bg-white text-slate-400 hover:text-clinical-600 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Client & Package</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Government Cap</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Actual Spend</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Utilization</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">DEX Ready</th>
                <th className="px-6 py-4 w-12 text-center text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-medium">Crunching financial data...</td></tr>
              ) : summary.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-clinical-100 group-hover:text-clinical-600 transition-colors">
                        {item.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          HCP LEVEL {item.hcpLevel}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-slate-400">
                    ${item.budget.toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`font-black ${item.utilization > 100 ? 'text-rose-600' : 'text-slate-800'}`}>
                      ${item.actual.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden min-w-[100px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(item.utilization, 100)}%` }}
                          className={`h-full ${item.utilization > 100 ? 'bg-rose-500' : 'bg-clinical-500'}`}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${item.utilization > 100 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {item.utilization.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {item.isDexReady ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : (
                      <div title="Missing SLK Data" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                        <AlertCircle size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <button className="p-2 text-slate-300 hover:text-clinical-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
