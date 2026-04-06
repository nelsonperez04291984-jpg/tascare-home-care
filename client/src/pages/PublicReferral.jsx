import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TASMANIA_AREAS = [
  'Hobart', 'Glenorchy', 'Clarence', 'Kingston', 'Launceston', 
  'Devonport', 'Burnie', 'Ulverstone', 'New Norfolk', 'Huonville'
];

const FUNDING_TYPES = ['HCP', 'CHSP', 'NDIS', 'Private', 'Unknown'];

const PublicReferral = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    dob: '',
    my_aged_care_id: '',
    funding_type: 'Unknown',
    hcp_level: '',
    referral_source: '',
    summary: '',
    service_area: 'Hobart'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsProcessing(true);

    const uploadData = new FormData();
    uploadData.append('referralFile', selectedFile);

    try {
      // AI Processing Call
      const res = await axios.post('/api/referrals/parse-ai', uploadData);
      const aiData = res.data;
      
      setFormData(prev => ({
        ...prev,
        client_name: aiData.client_name || '',
        dob: aiData.dob || '',
        my_aged_care_id: aiData.my_aged_care_id || '',
        funding_type: aiData.funding_type || 'Unknown',
        hcp_level: aiData.hcp_level || '',
        referral_source: aiData.referral_source || '',
        summary: aiData.summary || ''
      }));
    } catch (err) {
      console.error("AI Auto-fill failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/referrals/public', {
        ...formData,
        tenant_id: '00000000-0000-0000-0000-000000000000' 
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center p-12 glass rounded-2xl">
        <CheckCircle className="mx-auto text-green-500 mb-6" size={64} />
        <h2 className="text-3xl font-bold mb-4">Referral Received</h2>
        <p className="text-slate-600 mb-8">Our intake team in Tasmania will review the clinical details and contact the family shortly.</p>
        <button onClick={() => window.location.reload()} className="clinical-btn-primary">Submit Another Referral</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-slate-800 mb-2">Hospital & GP Referral Portal</h2>
        <p className="text-slate-500">Fast-track your patient's home care transition using our AI-assisted intake system.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Upload */}
        <div className="lg:col-span-1">
          <div 
            onClick={() => fileInputRef.current.click()}
            className={`cursor-pointer h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${file ? 'border-clinical-300 bg-clinical-50' : 'border-slate-300 hover:border-clinical-400 hover:bg-slate-50'}`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".pdf,.doc,.docx" />
            <div className="bg-white p-4 rounded-full shadow-md mb-4">
              {isProcessing ? <Loader2 className="animate-spin text-clinical-500" size={32} /> : <Upload className="text-clinical-500" size={32} />}
            </div>
            {isProcessing ? (
              <p className="text-clinical-700 font-medium">AI Analyzing Clinical Doc...</p>
            ) : (
              <p className="text-slate-500 font-medium">{file ? file.name : 'Upload Referral (PDF)'}</p>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-slate-100 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 italic">
              <AlertCircle size={16} /> Privacy Note
            </h4>
            <p className="text-xs text-slate-500">Data is processed securely according to Australian Privacy Principles. AI extracts clinical fields to reduce manual entry errors.</p>
          </div>
        </div>

        {/* Step 2: Form */}
        <div className="lg:col-span-2 glass p-8 rounded-2xl shadow-xl border-white/40">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Name</label>
                <input 
                  type="text" 
                  value={formData.client_name}
                  onChange={e => setFormData({...formData, client_name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 transition-all outline-none"
                  placeholder="Full Legal Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">My Aged Care ID</label>
                <input 
                  type="text" 
                  value={formData.my_aged_care_id}
                  onChange={e => setFormData({...formData, my_aged_care_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 transition-all outline-none"
                  placeholder="e.g. 1-123456"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Funding Type</label>
                <select 
                  value={formData.funding_type}
                  onChange={e => setFormData({...formData, funding_type: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 outline-none"
                >
                  {FUNDING_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tasmania Service Area</label>
              <select 
                value={formData.service_area}
                onChange={e => setFormData({...formData, service_area: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 outline-none"
              >
                {TASMANIA_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Clinical Summary / Urgency</label>
              <textarea 
                rows="4"
                value={formData.summary}
                onChange={e => setFormData({...formData, summary: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-clinical-400 transition-all outline-none"
                placeholder="Key clinical needs (mobility, dementia support, etc.)"
              ></textarea>
            </div>

            <button type="submit" className="w-full clinical-btn-primary h-12 text-lg">
              Submit Referral to TasCare team
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicReferral;
