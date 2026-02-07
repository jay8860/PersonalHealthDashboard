import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Activity,
  Moon,
  Upload,
  FileText,
  Plus,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  User,
  Brain,
  X,
  Loader2,
  ChevronRight,
  Lock,
  LogOut
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { uploadFile, getHealthData, login } from './api';

// --- Login Page Component ---
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await login(username, password);
      if (result.success) {
        onLogin(result.token);
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        <div className="flex flex-col items-center mb-10">
          <div className="bg-blue-600 p-4 rounded-3xl mb-6 shadow-xl shadow-blue-200">
            <Activity className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2 font-medium">Personal Health Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-10 text-center text-slate-400 text-sm font-medium">
          Secure AI Health Portal
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('health_token'));
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResult, setUploadedResult] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const data = await getHealthData();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleLogin = (newToken) => {
    localStorage.setItem('health_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('health_token');
    setToken(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      setUploadedResult(result);
      fetchHistory();
    } catch (err) {
      alert("Error uploading file: " + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => fileInputRef.current.click();

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Reuse the existing mockup data for charts
  const mockData = [
    { name: 'Mon', heartRate: 72, steps: 8000 },
    { name: 'Tue', heartRate: 75, steps: 9500 },
    { name: 'Wed', heartRate: 70, steps: 12000 },
    { name: 'Thu', heartRate: 68, steps: 7000 },
    { name: 'Fri', heartRate: 74, steps: 11000 },
    { name: 'Sat', heartRate: 80, steps: 15000 },
    { name: 'Sun', heartRate: 75, steps: 13000 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".xml,image/*,application/pdf"
      />

      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white border-r border-slate-200 z-50 transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl hidden md:block">HealthAI</span>
        </div>

        <div className="mt-10 px-4 space-y-2">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'reports', icon: FileText, label: 'Medical Reports' },
            { id: 'insights', icon: Brain, label: 'AI Deep Dive' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <item.icon size={24} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="absolute bottom-10 px-4 w-full">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all font-medium"
          >
            <LogOut size={24} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 pt-6 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">

          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Health Dashboard</h1>
              <p className="text-slate-500 mt-1 italic">
                {isUploading ? "Processing your data with AI..." : "Integrating your records for a smarter summary."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={triggerUpload}
                disabled={isUploading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                <span>{isUploading ? "Processing..." : "Upload New Record"}</span>
              </button>
            </div>
          </header>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <VitalsCard icon={Heart} label="Heart Rate" value="72" unit="bpm" color="red" trend="+2%" />
                  <VitalsCard icon={Activity} label="Blood Glucose" value="98" unit="mg/dL" color="emerald" trend="-5%" />
                  <VitalsCard icon={Moon} label="Sleep Duration" value="7.5" unit="hrs" color="indigo" trend="+12%" />
                </div>

                <div className="glass-card p-8 rounded-[2rem]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-xl text-slate-800">Health Progression</h3>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockData}>
                        <defs>
                          <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                        <Area type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSteps)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass-card p-8 rounded-[2.5rem] bg-slate-900 text-white border-0 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Brain size={120} />
                  </div>

                  <div className="relative z-10">
                    <div className="bg-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                      <Brain className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">AI Health Summary</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                      Integrated analysis of your Apple Health data and recent blood reports.
                    </p>

                    <div className="space-y-6">
                      <SummaryPoint icon={CheckCircle2} color="text-emerald-400" title="Metabolic Health" desc="Your blood glucose and heart rate variance are within optimal ranges." />
                      <SummaryPoint icon={AlertCircle} color="text-amber-400" title="Action Required" desc="Your Vitamin D levels are slightly low based on the latest report." />
                    </div>

                    <button className="w-full mt-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                      Generate New Insights
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem]">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                    <FileText size={18} className="text-blue-600" />
                    Recent Records
                  </h3>
                  <div className="space-y-4">
                    {history.length > 0 ? history.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            {item.type === 'apple_health' ? <Activity size={20} className="text-blue-600" /> : <FileText size={20} className="text-slate-600" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800 capitalize">{item.type.replace('_', ' ')}</p>
                            <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </div>
                    )) : (
                      <div className="text-center py-6 text-slate-400 text-sm italic">No records found. Upload one to start!</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadedResult && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl"><Brain className="text-blue-600" /></div>
                    <div>
                      <h2 className="text-2xl font-bold">AI Interpretation</h2>
                      <p className="text-slate-500 text-sm">Processed successfully</p>
                    </div>
                  </div>
                  <button onClick={() => setUploadedResult(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  {uploadedResult.type === 'medical_report' ? (
                    <div className="space-y-8">
                      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2">Executive Summary</h4>
                        <p className="text-blue-800/80 leading-relaxed text-sm">{uploadedResult.result.summary}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                          <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2"><AlertCircle size={18} />Concerns</h4>
                          <ul className="space-y-2">
                            {uploadedResult.result.concerns.map((c, i) => (<li key={i} className="text-xs text-amber-800 flex gap-2"><span>•</span> {c}</li>))}
                          </ul>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                          <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2"><CheckCircle2 size={18} />Positives</h4>
                          <ul className="space-y-2">
                            {uploadedResult.result.positives.map((p, i) => (<li key={i} className="text-xs text-emerald-800 flex gap-2"><span>•</span> {p}</li>))}
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800">Next Recommended Steps</h4>
                        <div className="space-y-2">
                          {uploadedResult.result.nextSteps.map((s, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium text-slate-700">
                              <div className="bg-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm border border-slate-200">{i + 1}</div>{s}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                      <h3 className="text-xl font-bold mb-2">Apple Health Data Synced</h3>
                      <button onClick={() => setUploadedResult(null)} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold">Done</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function VitalsCard({ icon: Icon, label, value, unit, color, trend }) {
  const colorMap = { red: 'bg-red-50 text-red-500', emerald: 'bg-emerald-50 text-emerald-500', indigo: 'bg-indigo-50 text-indigo-500', blue: 'bg-blue-50 text-blue-500' };
  return (
    <div className="glass-card p-6 rounded-[2rem] hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.blue}`}><Icon size={20} /></div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{trend}</span>
      </div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900">{value} <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span></p>
    </div>
  );
}

function SummaryPoint({ icon: Icon, color, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="bg-white/10 h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5"><Icon size={20} className={color} /></div>
      <div>
        <p className="font-bold text-sm md:text-base leading-tight mb-1">{title}</p>
        <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}

export default App;
