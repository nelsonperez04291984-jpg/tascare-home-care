import React, { useState } from 'react';
import axios from 'axios';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/login', { email, password });
      // Call the parent's onLogin with the fetched user details and token
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-clinical-600/20 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-clinical-500 rounded-2xl flex items-center justify-center rotate-3 shadow-2xl shadow-clinical-500/20 mb-6">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">TasCare Portal</h1>
          <p className="text-slate-400 text-center text-sm">Secure clinical intake & management for Australian Home Care Providers.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 transition-all"
                  placeholder="name@tascare.com.au"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl">
                    <AlertCircle size={16} />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 px-6 bg-clinical-600 hover:bg-clinical-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-clinical-600/20"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-500">
              For testing, use <span className="text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded">admin@tascare.com</span> & password <span className="text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded">admin</span>
            </p>
          </div>
        </div>
        
        {/* Helper for the Hospital / Public Intake side */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Are you a referring hospital? <a href="/public-referral" className="text-clinical-400 hover:text-clinical-300 font-semibold underline underline-offset-4 decoration-clinical-400/30 transition-colors">Submit intake form here</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
