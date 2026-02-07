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
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  Search,
  Bell
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
import { motion, AnimatePresence } from 'framer-motion';
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
      setError('Invalid credentials. Please try admin/admin123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse px-20"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-3xl mb-6 shadow-2xl shadow-blue-500/20">
              <Activity className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">HealthAI</h1>
            <p className="text-slate-400 mt-2 font-medium">Precision insights for your well-being</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white placeholder:text-slate-500"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white placeholder:text-slate-500"
                  placeholder="Password"
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
                  className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-500/20"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl py-4 font-bold text-lg shadow-xl shadow-blue-500/20 hover:opacity-90 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Sign In <ChevronRight size={20} /></>}
            </button>
          </form>
        </div>
        <p className="mt-8 text-center text-slate-500 text-sm font-medium">
          Protected by AES-256 Encryption
        </p>
      </motion.div>
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
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      alert("Error: " + errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!token) return <LoginPage onLogin={handleLogin} />;

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
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xml,.csv,image/*,application/pdf" />

      {/* Sidebar - Modern Floating Style */}
      <nav className="fixed left-6 top-6 bottom-6 w-24 lg:w-72 bg-white rounded-[3rem] shadow-2xl z-50 border border-slate-100 flex flex-col p-8 transition-all duration-500 overflow-hidden">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 hidden lg:block">HealthAI</span>
        </div>

        <div className="flex-1 space-y-3">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'reports', icon: ClipboardList, label: 'Reports' },
            { id: 'insights', icon: Sparkles, label: 'AI Coach' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 ${activeTab === item.id
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
              <item.icon size={24} className={activeTab === item.id ? 'animate-pulse' : ''} />
              <span className="font-bold text-lg hidden lg:block">{item.label}</span>
              {activeTab === item.id && <motion.div layoutId="active" className="ml-auto w-2 h-2 bg-white rounded-full hidden lg:block" />}
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-3xl transition-all font-bold">
            <LogOut size={24} />
            <span className="hidden lg:block text-lg">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="ml-36 lg:ml-[22rem] mr-6 pt-10 pb-20">
        <div className="max-w-6xl mx-auto">

          {/* Top Bar */}
          <header className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Daily Pulse</h2>
              <p className="text-slate-400 font-medium mt-1 italic">Welcome back, Admin</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search data..." className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-6 w-64 outline-none focus:border-blue-500 shadow-sm transition-all" />
              </div>
              <button className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-slate-500 relative">
                <Bell size={20} />
                <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                {isUploading ? "Analysing..." : "Upload New"}
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Stats Row */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <VitalsCard icon={Heart} label="Heart Rate" value="72" unit="bpm" color="rose" trend="+2" />
                  <VitalsCard icon={Activity} label="Glucose" value="98" unit="mg/dL" color="emerald" trend="-5" />
                  <VitalsCard icon={Moon} label="Sleep" value="7.5" unit="hrs" color="indigo" trend="+12" />

                  {/* Chart Card */}
                  <div className="md:col-span-3 glass-card p-10 rounded-[3rem]">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">Activity Trend</h3>
                        <p className="text-slate-400 text-sm font-medium">Steps count over the last 7 days</p>
                      </div>
                      <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        {['Week', 'Month', 'Year'].map(t => (
                          <button key={t} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${t === 'Week' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockData}>
                          <defs>
                            <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dx={-10} />
                          <Tooltip
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '20px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorSteps)" animationDuration={2000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-4 space-y-8">
                  {/* AI Quick Insight */}
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
                    <Sparkles className="absolute top-[-20px] right-[-20px] w-40 h-40 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-xl w-14 h-14 rounded-2xl flex items-center justify-center mb-8">
                        <Brain className="text-white" size={28} />
                      </div>
                      <h3 className="text-3xl font-black mb-4 leading-tight">AI Health Summary</h3>
                      <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed opacity-80">
                        Based on your blood work from Jan 15th and active recovery metrics.
                      </p>

                      <div className="space-y-6">
                        <InsightItem icon={CheckCircle2} title="Active recovery" desc="Heart Rate Variability is rising." />
                        <InsightItem icon={AlertCircle} title="Mineral Balance" desc="Zinc levels trending low." />
                      </div>

                      <button className="w-full mt-10 py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group/btn">
                        Open Health Report
                        <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity List */}
                  <div className="glass-card p-8 rounded-[3.5rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900">Recent Records</h3>
                      <button className="text-blue-600 font-bold text-sm hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                      {history.length > 0 ? history.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-50 rounded-3xl hover:border-blue-200 transition-all cursor-pointer shadow-sm group">
                          <div className="flex items-center gap-4">
                            <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors">
                              {item.type === 'apple_health' ? <Activity size={22} className="text-blue-500" /> : <ClipboardList size={22} className="text-indigo-500" />}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-sm capitalize">{item.type.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-400 font-bold mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      )) : (
                        <div className="text-center py-10">
                          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Search size={24} />
                          </div>
                          <p className="text-slate-400 text-sm font-medium italic">Discovery starts here. Upload a record!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Overlay for Results */}
          <AnimatePresence>
            {uploadedResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden"
                >
                  <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-5">
                      <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20"><Brain className="text-white" size={28} /></div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900">Health IQ Insight</h2>
                        <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Artificial Intelligence Engine v1.5</p>
                      </div>
                    </div>
                    <button onClick={() => setUploadedResult(null)} className="bg-white border border-slate-100 p-4 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X size={24} /></button>
                  </div>

                  <div className="p-12 max-h-[75vh] overflow-y-auto">
                    {uploadedResult.type === 'medical_report' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                          <div className="bg-blue-600 text-white p-8 rounded-[3rem] shadow-2xl shadow-blue-500/10">
                            <h4 className="font-black text-xl mb-4 flex items-center gap-2 underline decoration-blue-400 decoration-4 underline-offset-8">Executive Summary</h4>
                            <p className="text-blue-50/90 leading-relaxed text-lg font-medium">{uploadedResult.result.summary}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ResultPanel title="Concerns" items={uploadedResult.result.concerns} color="rose" icon={AlertCircle} />
                            <ResultPanel title="Positives" items={uploadedResult.result.positives} color="emerald" icon={CheckCircle2} />
                          </div>
                        </div>

                        <div className="space-y-8">
                          <h4 className="text-xl font-black text-slate-900 border-l-4 border-slate-900 pl-4">Next Steps</h4>
                          <div className="space-y-4">
                            {uploadedResult.result.nextSteps.map((s, i) => (
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100"
                              >
                                <p className="text-slate-700 font-bold leading-relaxed">{s}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 px-10">
                        <div className="animate-float mb-10">
                          <CheckCircle2 className="mx-auto text-emerald-500 stroke-[3px]" size={100} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Data Synchronized!</h3>
                        <p className="text-slate-400 font-medium text-lg mb-10">Your Apple Health metrics have been analyzed and integrated into your dashboard.</p>
                        <button onClick={() => setUploadedResult(null)} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl">Confirm & View</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function VitalsCard({ icon: Icon, label, value, unit, color, trend }) {
  const colors = {
    rose: 'from-rose-500 to-pink-600 bg-rose-50 text-rose-600 shadow-rose-500/10',
    emerald: 'from-emerald-500 to-teal-600 bg-emerald-50 text-emerald-600 shadow-emerald-500/10',
    indigo: 'from-indigo-500 to-blue-600 bg-indigo-50 text-indigo-600 shadow-indigo-500/10'
  };

  return (
    <div className="glass-card p-8 rounded-[3.5rem] group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color].split(' ').slice(0, 2).join(' ')} opacity-[0.03] rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700`}></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={`p-4 rounded-2xl ${colors[color].split(' ')[2]} ${colors[color].split(' ')[3]} shadow-lg transition-transform group-hover:rotate-12`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 font-black text-sm px-4 py-2 rounded-2xl ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          <TrendingUp size={14} className={trend.startsWith('-') ? 'rotate-180' : ''} />
          {trend}%
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 tracking-tighter">{value}</span>
          <span className="text-lg font-bold text-slate-300">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function InsightItem({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-5">
      <div className="bg-white/20 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 group-hover:scale-110 transition-transform"><Icon size={24} className="text-white" /></div>
      <div>
        <p className="font-black text-lg text-white leading-tight mb-1">{title}</p>
        <p className="text-sm text-indigo-100/70 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ResultPanel({ title, items, color, icon: Icon }) {
  const c = color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900';
  const dot = color === 'rose' ? 'bg-rose-400' : 'bg-emerald-400';

  return (
    <div className={`p-8 rounded-[2.5rem] border ${c}`}>
      <h4 className="font-black text-xl mb-6 flex items-center gap-3">
        <Icon className={color === 'rose' ? 'text-rose-600' : 'text-emerald-600'} size={24} />
        {title}
      </h4>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-4 text-sm font-bold opacity-80 leading-relaxed px-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${dot}`}></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
