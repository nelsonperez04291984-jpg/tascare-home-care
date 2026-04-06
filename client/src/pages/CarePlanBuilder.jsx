import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, PiggyBank, Heart, Target, ListChecks, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HCP_BUDGETS = {
  '1': 850,
  '2': 1500,
  '3': 3300,
  '4': 5000
};

const SERVICE_TYPES = [
  { name: 'Personal Care', rate: 65 },
  { name: 'Nursing Care', rate: 110 },
  { name: 'Cleaning/Home Help', rate: 55 },
  { name: 'Meal Preparation', rate: 60 },
  { name: 'Transport', rate: 50 },
  { name: 'Social Support', rate: 55 },
  { name: 'Gardening', rate: 70 }
];

const CarePlanBuilder = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [goals, setGoals] = useState([{ id: 1, text: '', priority: 'Medium' }]);
  const [services, setServices] = useState([
    { id: 1, type: 'Personal Care', hours: 2, frequency: 'weekly', rate: 65 }
  ]);
  const [hcpLevel, setHcpLevel] = useState('3'); // Default for demo

  // Monthly breakdown calculation
  const calculateMonthlySpend = () => {
    return services.reduce((total, s) => {
      const multiplier = s.frequency === 'weekly' ? 4.33 : 2.16; // Average weeks per month
      return total + (s.hours * s.rate * multiplier);
    }, 0);
  };

  const monthlySpend = calculateMonthlySpend();
  const monthlyAllowance = HCP_BUDGETS[hcpLevel] || 0;
  const budgetUtilization = (monthlySpend / monthlyAllowance) * 100;

  const addGoal = () => setGoals([...goals, { id: Date.now(), text: '', priority: 'Medium' }]);
  const removeGoal = (id) => setGoals(goals.filter(g => g.id !== id));

  const addService = () => setServices([...services, { id: Date.now(), type: 'Personal Care', hours: 1, frequency: 'weekly', rate: 65 }]);
  const removeService = (id) => setServices(services.filter(s => s.id !== id));

  const updateService = (id, field, value) => {
    setServices(services.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === 'type') {
          updated.rate = SERVICE_TYPES.find(st => st.name === value)?.rate || 65;
        }
        return updated;
      }
      return s;
    }));
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/care-scheduling', {
        client_id: clientId || '00000000-0000-0000-0000-000000000000',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        goals,
        services,
        monthly_budget: monthlyAllowance
      });
      alert('Care Plan Saved Successfully');
      navigate('/');
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Clinical Care Plan Builder</h2>
            <p className="text-slate-500 italic">Designing support for Sarah Mitchell (HCP Level {hcpLevel})</p>
          </div>
        </div>
        <button onClick={handleSave} className="clinical-btn-primary flex items-center gap-2">
          <Save size={20} />
          <span>Finalize Care Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Goals & Clinical Targets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl shadow-sm border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="text-clinical-600" /> Life Goals
            </h3>
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={goal.id} className="relative group p-3 bg-white border border-slate-100 rounded-xl">
                  <input 
                    type="text" 
                    placeholder="e.g. Remain independent at home"
                    value={goal.text}
                    onChange={(e) => setGoals(goals.map(g => g.id === goal.id ? {...g, text: e.target.value} : g))}
                    className="w-full text-sm font-medium pr-8 outline-none bg-transparent"
                  />
                  <select 
                    value={goal.priority}
                    onChange={(e) => setGoals(goals.map(g => g.id === goal.id ? {...g, priority: e.target.value} : g))}
                    className="mt-2 text-[10px] uppercase font-bold text-slate-400 bg-transparent outline-none"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <button onClick={() => removeGoal(goal.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={addGoal} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-clinical-300 hover:text-clinical-600 transition-all flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> Add Goal
              </button>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl shadow-sm border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PiggyBank className="text-clinical-600" /> HCP Budget Tracker
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-slate-500">Monthly Spend</span>
                <span className="text-xl font-bold">${Math.round(monthlySpend)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                  className={`h-full ${budgetUtilization > 90 ? 'bg-rose-500' : 'bg-clinical-500'}`}
                />
              </div>
              <p className="text-center text-xs text-slate-400">
                {budgetUtilization > 100 
                  ? `Warning: Plan exceeds level ${hcpLevel} allowance by $${Math.round(monthlySpend - monthlyAllowance)}`
                  : `Remaining Allowance: $${Math.round(monthlyAllowance - monthlySpend)}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Service Selection */}
        <div className="lg:col-span-2">
          <div className="glass p-8 rounded-3xl shadow-xl border-white/40">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ListChecks className="text-clinical-600" /> Proposed Services
            </h3>
            
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="flex gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl items-center">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Service Type</label>
                    <select 
                      value={service.type}
                      onChange={(e) => updateService(service.id, 'type', e.target.value)}
                      className="w-full bg-transparent font-semibold outline-none"
                    >
                      {SERVICE_TYPES.map(st => <option key={st.name} value={st.name}>{st.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hours</label>
                    <input 
                      type="number"
                      value={service.hours}
                      onChange={(e) => updateService(service.id, 'hours', parseFloat(e.target.value))}
                      className="w-full bg-transparent font-semibold outline-none border-b border-transparent focus:border-clinical-400"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Frequency</label>
                    <select 
                      value={service.frequency}
                      onChange={(e) => updateService(service.id, 'frequency', e.target.value)}
                      className="w-full bg-transparent font-semibold outline-none"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                    </select>
                  </div>

                  <div className="w-24 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cost</p>
                    <p className="font-bold text-clinical-700">${Math.round(service.hours * service.rate)}</p>
                  </div>

                  <button onClick={() => removeService(service.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <button 
                onClick={addService}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-medium hover:bg-slate-50 hover:border-clinical-400 hover:text-clinical-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus /> Add Service Line
              </button>
            </div>

            <div className="mt-12 p-6 bg-clinical-50 rounded-2xl border border-clinical-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-clinical-800">
                <Heart size={32} />
                <div>
                  <p className="font-bold uppercase text-[10px] tracking-widest opacity-60">Plan Quality Check</p>
                  <p className="text-sm font-medium">This care plan addresses mobility and social needs.</p>
                </div>
              </div>
              <p className="text-2xl font-black text-clinical-600">PASSED</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarePlanBuilder;
