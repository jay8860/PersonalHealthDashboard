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
  Search,
  Bell,
  Droplet,
  Zap,
  Thermometer,
  Wind,
  Footprints,
  Ruler,
  Scale,
  Timer,
  Move,
  Music,
  Ear,
  Trash2,
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Loader2,
  Lock,
  X,
  CheckSquare,
  Square
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
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFiles, getHealthData, deleteRecord, getDeepAnalysis, deleteBulk } from './api';

// --- Configuration for Health Metrics ---
const metricConfig = {
  // Vitals
  heartRate: { label: 'Heart Rate', unit: 'bpm', icon: Activity, color: 'red' },
  restingHeartRate: { label: 'Resting HR', unit: 'bpm', icon: Heart, color: 'rose' },
  heartRateVariabilitySDNN: { label: 'HRV', unit: 'ms', icon: Activity, color: 'indigo' },
  respiratoryRate: { label: 'Resp. Rate', unit: 'br/min', icon: Wind, color: 'blue' },
  vo2Max: { label: 'VO2 Max', unit: 'ml/kg', icon: Wind, color: 'emerald' },
  oxygenSaturation: { label: 'SpO2', unit: '%', icon: Droplet, color: 'cyan' },
  bodyTemperature: { label: 'Body Temp', unit: '°C', icon: Thermometer, color: 'orange' },

  // Activity
  stepCount: { label: 'Steps', unit: 'steps', icon: Footprints, color: 'yellow' },
  distanceWalkingRunning: { label: 'Distance', unit: 'km', icon: Move, color: 'lime' },
  flightsClimbed: { label: 'Flights', unit: 'floors', icon: TrendingUp, color: 'orange' },
  activeEnergyBurned: { label: 'Active Cal', unit: 'kcal', icon: Zap, color: 'red' },
  basalEnergyBurned: { label: 'Resting Cal', unit: 'kcal', icon: Zap, color: 'purple' },
  appleExerciseTime: { label: 'Exercise', unit: 'min', icon: Timer, color: 'green' },
  standTime: { label: 'Stand Time', unit: 'min', icon: User, color: 'blue' },

  // Body
  bodyMass: { label: 'Weight', unit: 'kg', icon: Scale, color: 'blue' },
  bodyMassIndex: { label: 'BMI', unit: '', icon: Scale, color: 'indigo' },
  leanBodyMass: { label: 'Lean Mass', unit: 'kg', icon: User, color: 'cyan' },
  height: { label: 'Height', unit: 'm', icon: Ruler, color: 'teal' },
  waistCircumference: { label: 'Waist', unit: 'cm', icon: Ruler, color: 'violet' },

  // Blood Pressure
  bloodPressureSystolic: { label: 'BP Systolic', unit: 'mmHg', icon: Droplet, color: 'rose' },
  bloodPressureDiastolic: { label: 'BP Diastolic', unit: 'mmHg', icon: Droplet, color: 'rose' },

  // Mobility
  walkingSpeed: { label: 'Walk Speed', unit: 'km/h', icon: Move, color: 'blue' },
  walkingStepLength: { label: 'Step Length', unit: 'cm', icon: Ruler, color: 'indigo' },
  walkingAsymmetryPercentage: { label: 'Asymmetry', unit: '%', icon: Activity, color: 'orange' },
  walkingDoubleSupportPercentage: { label: 'Dbl Support', unit: '%', icon: Activity, color: 'cyan' },

  // Environment
  environmentalAudioExposure: { label: 'Audio Exp', unit: 'dB', icon: Ear, color: 'yellow' },
  headphoneAudioExposure: { label: 'Headphone', unit: 'dB', icon: Music, color: 'pink' },
};

// --- Main App Component ---
function App() {
  const [token, setToken] = useState('always-authenticated'); // Bypassing login for local testing
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedResult, setUploadedResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendMetric, setTrendMetric] = useState('stepCount');
  const [trendTimeframe, setTrendTimeframe] = useState('Week');
  const [healthMetrics, setHealthMetrics] = useState({});
  const [mockData, setMockData] = useState([
    { name: '00:00', value: 0 },
    { name: '04:00', value: 0 },
    { name: '08:00', value: 0 },
    { name: '12:00', value: 0 },
    { name: '16:00', value: 0 },
    { name: '20:00', value: 0 },
    { name: '23:59', value: 0 },
  ]);
  const [ecgHistory, setEcgHistory] = useState([]);
  const [cdaHistory, setCdaHistory] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);

  const groupHistoryByDate = (history) => {
    const groups = {};
    history.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  useEffect(() => {
    fetchHistory();
    // Auto-refresh every 30s to see new data
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getHealthData();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleLogout = () => {
    // Disabled logout for local development
    console.log("Logout clicked - disabled for dev");
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleBulkDeleteStart = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirmOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setDeleteConfirmOpen(false);
    try {
      await deleteBulk(selectedIds);
      fetchHistory();
      setSelectedIds([]);
    } catch (err) {
      alert("Failed to delete records: " + err.message);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (ids) => {
    if (selectedIds.length === ids.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ids);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteRecord(id);
      fetchHistory();
      if (uploadedResult && uploadedResult.id === id) setUploadedResult(null);
    } catch (err) {
      alert("Failed to delete record: " + err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const response = await uploadFiles(files, (progress) => {
        setUploadProgress(progress);
      });

      if (response.results && response.results.length > 0) {
        setUploadedResult(response.results[0]);

        // Immediate state update for responsive UI
        response.results.forEach(res => {
          if (res.type === 'medical_report') setMedicalHistory(prev => [res.result, ...prev]);
          if (res.type === 'electrocardiogram') setEcgHistory(prev => [res.result, ...prev]);
          if (res.type === 'cda_document') setCdaHistory(prev => [res.result, ...prev]);
        });
      }
      fetchHistory();
    } catch (err) {
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      alert("Error: " + errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Process history to get the latest health data and clinical history
  useEffect(() => {
    if (history.length > 0) {
      // 1. Extract Reports
      const reports = history.filter(item => item.type === 'medical_report' && item.data).map(item => item.data);
      const uniqueReports = [];
      const seenSummaries = new Set();
      reports.forEach(r => { if (!seenSummaries.has(r.summary)) { uniqueReports.push(r); seenSummaries.add(r.summary); } });
      setMedicalHistory(uniqueReports);

      // 2. Extract ECGs
      const ecgs = history.filter(item => item.type === 'electrocardiogram' && item.data).map(item => item.data);
      setEcgHistory(ecgs);

      // 3. Extract CDAs
      const cdas = history.filter(item => item.type === 'cda_document' && item.data).map(item => item.data);
      setCdaHistory(cdas);

      // 4. Extract standard Apple Health metrics from the latest upload
      const latestAppleHealth = history.find(item => item.type === 'apple_health' || item.type === 'cda_document');
      if (latestAppleHealth && latestAppleHealth.data) {
        processHealthData(latestAppleHealth.data);
      }
    }
  }, [history]);

  // Comprehensive Deep Analysis Trigger
  useEffect(() => {
    const fetchDeepAnalysis = async () => {
      if (Object.keys(healthMetrics).length > 0) {
        setIsAnalyzing(true);
        try {
          const result = await getDeepAnalysis(healthMetrics, medicalHistory, ecgHistory, cdaHistory);
          setDeepAnalysis(result);
        } catch (e) {
          console.error("Deep analysis failed", e);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    if (activeTab === 'insights' && !deepAnalysis && history.length > 0) {
      console.log("Deep Analysis Trigger: Conditions met. history:", history.length, "metrics:", Object.keys(healthMetrics).length);
      fetchDeepAnalysis();
    }
  }, [activeTab, healthMetrics, medicalHistory, history, deepAnalysis]);

  // --- AI Insight Generator ---
  const generateInsights = (metrics, medHistory = []) => {
    const insights = [];
    const suggestions = [];

    // 1. Heart Rate Analysis
    if (metrics.heartRate) {
      if (metrics.heartRate > 100) {
        insights.push({ icon: AlertCircle, title: "Elevated Heart Rate", desc: "Your average HR is high today. Consider verifying with manual measurement or resting.", color: "rose" });
        suggestions.push("Avoid caffeine and heavy meals.");
      } else if (metrics.heartRate < 60 && metrics.heartRate > 40) {
        insights.push({ icon: CheckCircle2, title: "Athlete's Heart", desc: "Resting HR indicates excellent cardiovascular fitness.", color: "emerald" });
      }
    }

    // 2. Steps / Activity
    if (metrics.stepCount) {
      if (metrics.stepCount < 3000) {
        insights.push({ icon: AlertCircle, title: "Low Activity", desc: "Step count is below recommended 5,000 daily minimum.", color: "rose" });
        suggestions.push("Take a 15-minute walk after dinner.");
      } else if (metrics.stepCount > 8000) {
        insights.push({ icon: CheckCircle2, title: "Active Day", desc: "You've met the daily activity goal!", color: "emerald" });
        suggestions.push("Great job! Stay hydrated.");
      }
    }

    // 3. Sleep
    if (metrics.sleepBreakdown) {
      const totalHours = metrics.sleepBreakdown.total / 60;
      if (totalHours < 6) {
        insights.push({ icon: AlertCircle, title: "Sleep Debt", desc: "Less than 6 hours of sleep detected.", color: "rose" });
        suggestions.push("Try to sleep 30 mins earlier tonight.");
      } else if (metrics.sleepBreakdown.deep / 60 < 1) {
        suggestions.push("Deep sleep is low. Avoid screens before bed.");
      }
    }

    // 4. Medical Report Integration (Holistic Picture)
    if (medHistory.length > 0) {
      const latestReport = medHistory[0];
      const findings = (latestReport.concerns || []).join(" ").toLowerCase();

      if (latestReport.concerns && latestReport.concerns.length > 0) {
        insights.push({ icon: FileText, title: "Report Sync", desc: `Coaching adjusted for: ${latestReport.concerns[0]}`, color: "purple" });

        // CROSS-METRIC RULES

        // Rule: Vitamin D + Steps
        if (findings.includes("vitamin d")) {
          if (metrics.stepCount < 5000) {
            insights.push({ icon: Sparkles, title: "Outdoor Motivation", desc: "Vitamin D is low and activity is minimal. Aim for a 20-min sun-walk.", color: "yellow" });
            suggestions.push("Combine walks with morning sunlight for Vitamin D synthesis.");
          } else {
            insights.push({ icon: CheckCircle2, title: "Sun Exposure", desc: "Great job staying active despite Vitamin D deficiency report.", color: "emerald" });
          }
        }

        // Rule: Gastritis/Upset Stomach + Activity
        if (findings.includes("gastritis") || findings.includes("upset stomach") || findings.includes("stomach")) {
          insights.push({ icon: AlertCircle, title: "Digestive Care", desc: "Report indicates stomach sensitivity. Keep meals light.", color: "orange" });
          if (metrics.stepCount > 10000) {
            suggestions.push("Highly active today; ensure you are not straining your stomach area.");
          }
          suggestions.push("Drink small sips of water throughout the day for gastritis.");
        }

        // Rule: Sleep + Stress/Fatigue
        if (findings.includes("fatigue") || findings.includes("tired")) {
          if (metrics.sleepBreakdown && metrics.sleepBreakdown.total / 60 < 7) {
            insights.push({ icon: Moon, title: "Recovery Needed", desc: "Report mentions fatigue and sleep is < 7h. Prioritize rest.", color: "indigo" });
          }
        }
      }
    }

    // Default messages if everything is normal or missing
    if (insights.length === 0) {
      insights.push({ icon: CheckCircle2, title: "Balanced Metrics", desc: "Your vitals are within normal range today.", color: "emerald" });
    }
    if (suggestions.length === 0) {
      suggestions.push("Maintain a consistent sleep schedule.");
      suggestions.push("Drink 2L of water daily.");
    }

    return { insights, suggestions };
  };

  const [aiInsights, setAiInsights] = useState({ insights: [], suggestions: [] });
  const [dailyDate, setDailyDate] = useState("Today");

  const processHealthData = (data) => {
    const parseDate = (dStr) => dStr ? new Date(dStr.replace(' +', '+')) : new Date();
    const formatTime = (dObj) => dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // NEW: Handle Historical Data from backend
    if (data.history) {
      setHistoricalData(data.history);
      const todayKey = new Date().toISOString().split('T')[0];
      setDailyDate(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }

    const newMetrics = {};
    const metricsToUse = data.metrics || data;

    Object.keys(metricConfig).forEach(key => {
      if (metricsToUse[key] !== undefined) {
        const val = typeof metricsToUse[key] === 'object' ? (metricsToUse[key].sum / metricsToUse[key].count) : metricsToUse[key];
        newMetrics[key] = typeof val === 'number' ? Math.round(val) : val;
        newMetrics[`${key}_context`] = "Latest";
      }
    });

    if (newMetrics.bloodPressureSystolic && newMetrics.bloodPressureDiastolic) {
      newMetrics.bp = `${newMetrics.bloodPressureSystolic}/${newMetrics.bloodPressureDiastolic}`;
    }

    if (data.history && data.history.length > 0) {
      const latest = data.history[data.history.length - 1];
      const chartData = data.history.slice(-14).map(h => ({
        name: h.date.split('-').slice(1).join('/'),
        value: h.stepCount ? h.stepCount.sum : 0
      }));
      setMockData(chartData);
    }

    setHealthMetrics(prev => ({ ...prev, ...newMetrics }));
  };




  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".xml,.csv,.xlsx,.xls,image/*,application/pdf,.txt,text/plain" />

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
              <p className="text-slate-400 font-medium mt-1 italic">Welcome back, Jayant • {dailyDate}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search data..." className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-6 w-64 outline-none focus:border-blue-500 shadow-sm transition-all" />
              </div>

              {/* Progress Container */}
              {isUploading && (
                <div className="flex flex-col items-end gap-1 min-w-[200px]">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                    <Loader2 className="animate-spin" size={14} />
                    <span>{uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : 'Processing AI...'}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1 shadow-inner">
                    <motion.div
                      layout
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                {isUploading ? "Please Wait..." : "Upload New"}
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
                <div className="lg:col-span-8 grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Dynamic Vitals Cards */}
                    {Object.entries(healthMetrics).map(([key, value]) => {
                      if (key === 'sleep' || key === 'sleepBreakdown') return null; // Handle sleep separately
                      const config = metricConfig[key];
                      if (!config) return null;

                      return (
                        <VitalsCard
                          key={key}
                          icon={config.icon}
                          label={config.label}
                          value={value}
                          unit={config.unit}
                          context={healthMetrics[`${key}_context`]}
                          color={config.color}
                        />
                      );
                    })}

                    {/* ECG Summary if exists */}
                    {ecgHistory.length > 0 && (
                      <div
                        onClick={() => setUploadedResult({ id: 'latest_ecg', type: 'electrocardiogram', data: ecgHistory[0] })}
                        className="col-span-full md:col-span-1 lg:col-span-2 glass-card p-8 rounded-[3rem] cursor-pointer hover:border-rose-200 transition-all border-2 border-transparent relative overflow-hidden group/ecg"
                      >
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                          <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl group-hover/ecg:scale-110 transition-transform">
                            <Heart size={24} fill="currentColor" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Latest Rhythm</p>
                            <h4 className="text-lg font-black text-slate-900">{ecgHistory[0].metadata.classification}</h4>
                          </div>
                        </div>
                        <div className="h-16 opacity-30 group-hover/ecg:opacity-60 transition-opacity">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ecgHistory[0].samples.slice(0, 40).map((v, i) => ({ i, v }))}>
                              <Line type="monotone" dataKey="v" stroke="#f43f5e" strokeWidth={3} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 right-0 p-4">
                          <Zap size={14} className="text-rose-200" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sleep Section (if available) */}
                  {healthMetrics.sleep && (
                    <div className="glass-card p-8 rounded-[3rem] relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                          <Moon size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">Sleep Analysis</h3>
                        <span className="ml-auto text-4xl font-black text-indigo-600 tracking-tighter">{healthMetrics.sleep}</span>
                      </div>

                      {healthMetrics.sleepBreakdown && (
                        <div className="grid grid-cols-3 gap-4 relative z-10">
                          <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                            <p className="text-xs uppercase font-bold text-indigo-400 mb-1">Deep</p>
                            <p className="font-black text-indigo-900 text-lg">{Math.round(healthMetrics.sleepBreakdown.deep / 60 * 10) / 10}h</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-2xl text-center">
                            <p className="text-xs uppercase font-bold text-purple-400 mb-1">REM</p>
                            <p className="font-black text-purple-900 text-lg">{Math.round(healthMetrics.sleepBreakdown.rem / 60 * 10) / 10}h</p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-2xl text-center">
                            <p className="text-xs uppercase font-bold text-blue-400 mb-1">Core</p>
                            <p className="font-black text-blue-900 text-lg">{Math.round((healthMetrics.sleepBreakdown.total - healthMetrics.sleepBreakdown.deep - healthMetrics.sleepBreakdown.rem) / 60 * 10) / 10}h</p>
                          </div>
                        </div>
                      )}

                      {/* Decorative Background */}
                      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600 opacity-5 rounded-full blur-3xl"></div>
                    </div>
                  )}

                  {/* Chart Card */}
                  <div className="glass-card p-10 rounded-[3rem]">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">Health Trends</h3>
                        <p className="text-slate-400 text-sm font-medium">Long-term tracking from all health uploads</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <select
                          value={trendMetric}
                          onChange={(e) => setTrendMetric(e.target.value)}
                          className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="stepCount">Steps</option>
                          <option value="heartRate">Heart Rate</option>
                          <option value="heartRateVariabilitySDNN">HRV</option>
                          <option value="sleep">Sleep</option>
                          <option value="bodyMass">Weight</option>
                        </select>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          {['Week', 'Month', 'Year'].map(t => (
                            <button
                              key={t}
                              onClick={() => setTrendTimeframe(t)}
                              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${trendTimeframe === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="h-[350px] w-full" style={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={(() => {
                          let source = [];
                          if (trendTimeframe === 'Week') source = historicalData.slice(-7);
                          else if (trendTimeframe === 'Month') source = historicalData.slice(-30);
                          else {
                            const groups = {};
                            historicalData.forEach(h => {
                              const month = h.date.substring(0, 7);
                              if (!groups[month]) groups[month] = { date: month, values: [] };
                              let val = 0;
                              if (h[trendMetric]) {
                                const isActivity = ['stepCount', 'distanceWalkingRunning', 'activeEnergyBurned', 'flightsClimbed'].includes(trendMetric);
                                val = typeof h[trendMetric] === 'object'
                                  ? (isActivity ? h[trendMetric].sum : h[trendMetric].sum / h[trendMetric].count)
                                  : h[trendMetric];
                              }
                              groups[month].values.push(val);
                            });
                            source = Object.values(groups).map(g => ({
                              date: g.date,
                              computedValue: g.values.reduce((a, b) => a + b, 0) / g.values.length
                            }));
                          }

                          return source.map(h => {
                            let rawValue = h.computedValue !== undefined ? h.computedValue : 0;
                            if (h.computedValue === undefined && h[trendMetric]) {
                              const isActivity = ['stepCount', 'distanceWalkingRunning', 'activeEnergyBurned', 'flightsClimbed'].includes(trendMetric);
                              rawValue = typeof h[trendMetric] === 'object'
                                ? (isActivity ? h[trendMetric].sum : h[trendMetric].sum / h[trendMetric].count)
                                : h[trendMetric];
                            }

                            let finalValue = rawValue;
                            if (trendMetric === 'sleep') finalValue = Math.round((rawValue / 60) * 10) / 10;
                            else if (trendMetric === 'stepCount' || trendMetric === 'heartRate') finalValue = Math.round(rawValue);
                            else finalValue = Math.round(rawValue * 10) / 10;

                            return {
                              name: trendTimeframe === 'Year' ? new Date(h.date + "-01").toLocaleDateString(undefined, { month: 'short' }) : h.date.split('-').slice(1).join('/'),
                              value: finalValue,
                              unit: trendMetric === 'sleep' ? 'h' : (metricConfig[trendMetric]?.unit || '')
                            };
                          });
                        })()}>
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
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorSteps)" animationDuration={2000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* New: Clinical Findings from Reports */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {cdaHistory.length > 0 && (
                      <div className="glass-card p-10 rounded-[3rem]">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
                            <ShieldCheck size={28} />
                          </div>
                          <div>
                            <h4 className="font-black text-xl text-slate-800">Latest Lab Observations</h4>
                            <p className="text-slate-400 text-sm font-bold">From structured clinical exports</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {cdaHistory[0]?.observations.slice(0, 4).map((obs, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                              <span className="font-bold text-slate-600 truncate mr-4">{obs.name}</span>
                              <span className="font-black text-emerald-600 shrink-0">{obs.value} <span className="text-[10px] text-slate-400 font-black">{obs.unit}</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {medicalHistory.length > 0 && (
                      <div className="glass-card p-10 rounded-[3rem]">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                            <ClipboardList size={28} />
                          </div>
                          <div>
                            <h4 className="font-black text-xl text-slate-800">Key Report Highlights</h4>
                            <p className="text-slate-400 text-sm font-bold">AI extracted from clinical notes</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {medicalHistory.slice(0, 1).map(h =>
                            (h.highlights || []).slice(0, 3).map((high, i) => (
                              <div key={i} className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${high.color === 'rose' ? 'bg-rose-500' : high.color === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                <div>
                                  <p className="font-black text-sm text-slate-800 leading-tight">{high.title}</p>
                                  <p className="text-xs text-slate-500 font-medium mt-1">{high.desc.substring(0, 60)}...</p>
                                </div>
                              </div>
                            ))
                          )}
                          {medicalHistory.length > 0 && !(medicalHistory[0].highlights) && (
                            <p className="text-slate-400 text-sm italic">Highlighting historical report data...</p>
                          )}
                        </div>
                      </div>
                    )}
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
                        Daily analysis for {dailyDate}.
                      </p>

                      <div className="space-y-6">
                        {aiInsights.insights.slice(0, 2).map((insight, idx) => (
                          <InsightItem key={idx} icon={insight.icon} title={insight.title} desc={insight.desc} />
                        ))}
                        {aiInsights.insights.length === 0 && (
                          <div className="text-center text-indigo-200 text-sm">No significant alerts today.</div>
                        )}
                      </div>

                      <button onClick={() => setActiveTab('insights')} className="w-full mt-10 py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group/btn">
                        Open Health Report
                        <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity List */}
                  <div className="glass-card p-8 rounded-[3.5rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900">Recent Records</h3>
                      <button onClick={() => setActiveTab('reports')} className="text-blue-600 font-bold text-sm hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                      {history.length > 0 ? history.slice(0, 4).map((item, idx) => (
                        <div key={idx} onClick={() => { setUploadedResult(item); }} className="flex items-center justify-between p-5 bg-white border border-slate-50 rounded-3xl hover:border-blue-200 transition-all cursor-pointer shadow-sm group">
                          <div className="flex items-center gap-4">
                            <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors">
                              {item.type.includes('apple') ? <Activity size={22} className="text-blue-500" /> : <ClipboardList size={22} className="text-indigo-500" />}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-sm capitalize">{item.type.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-400 font-bold mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(item.id); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
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
                  </div >
                </div >
              </motion.div >
            )
            }

            {
              activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-12 rounded-[3rem]"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Health History</h3>
                      <p className="text-slate-400 font-bold mt-2">Grouped by date of upload</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {history.length > 0 && (
                        <button
                          onClick={handleBulkDeleteStart}
                          disabled={selectedIds.length === 0}
                          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm border transition-all ${selectedIds.length > 0 ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed'}`}
                        >
                          <Trash2 size={18} />
                          Delete Selected ({selectedIds.length})
                        </button>
                      )}

                      <button
                        onClick={() => handleSelectAll(history.map(x => x.id))}
                        className="flex items-center gap-2 bg-slate-50 text-slate-600 px-6 py-3 rounded-2xl font-black text-sm border border-slate-100 hover:bg-slate-100 transition-all"
                      >
                        {selectedIds.length === history.length && history.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                        {selectedIds.length === history.length && history.length > 0 ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-16">
                    {Object.entries(groupHistoryByDate(history)).map(([date, items]) => (
                      <div key={date}>
                        <div className="flex items-center gap-4 mb-8">
                          <h4 className="text-xl font-black text-slate-900 border-l-4 border-blue-600 pl-4">{date}</h4>
                          <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {items.map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => setUploadedResult(item)}
                              className={`group relative bg-white p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 ${selectedIds.includes(item.id) ? 'border-blue-600 bg-blue-50/20' : 'border-slate-50 hover:border-blue-200'}`}
                            >
                              <div
                                onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                                className={`absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white border cursor-pointer hover:border-blue-400 ${selectedIds.includes(item.id) ? 'border-blue-600 text-blue-600 shadow-xl shadow-blue-500/20' : 'border-slate-200 text-slate-300 hover:text-blue-400'}`}
                              >
                                {selectedIds.includes(item.id) ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={2} />}
                              </div>

                              <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-2xl ${item.type === 'medical_report' ? 'bg-indigo-50 text-indigo-600' :
                                  item.type === 'electrocardiogram' ? 'bg-rose-50 text-rose-600' :
                                    item.type === 'cda_document' ? 'bg-emerald-50 text-emerald-600' :
                                      'bg-blue-50 text-blue-600'
                                  }`}>
                                  {item.type === 'medical_report' ? <ClipboardList size={26} /> :
                                    item.type === 'electrocardiogram' ? <Heart size={26} fill="currentColor" /> :
                                      item.type === 'cda_document' ? <ShieldCheck size={26} /> :
                                        <Activity size={26} />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 px-3 py-1 rounded-full">{item.type.replace('_', ' ')}</span>
                              </div>
                              <h4 className="font-black text-xl text-slate-800 mb-2 capitalize">
                                {item.type === 'electrocardiogram' ? (item.data.metadata.classification) :
                                  item.type === 'cda_document' ? (item.data.title) :
                                    item.type.replace('_', ' ')}
                              </h4>
                              <p className="text-slate-400 font-bold text-sm mb-8">{new Date(item.created_at).toLocaleTimeString()}</p>
                              <div className="flex items-center justify-between gap-2 text-blue-600 font-black text-sm">
                                <span className="flex items-center gap-2 group-hover:gap-4 transition-all">View Detail <ChevronRight size={16} /></span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRecord(item.id); }}
                                  className="p-3 bg-rose-50 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center py-40 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100">
                        <Search size={80} className="mx-auto text-slate-200 mb-6" />
                        <h4 className="text-2xl font-black text-slate-900 mb-2">No Records Yet</h4>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto">Upload your medical reports to start your AI health journey.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            }

            {
              activeTab === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-blue-50">
                      <div className="flex items-center gap-6 mb-10 text-blue-600">
                        <Sparkles size={40} />
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Deep Health Analysis</h3>
                      </div>

                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-6">
                          <Loader2 className="animate-spin text-blue-600" size={60} />
                          <p className="text-slate-400 font-bold animate-pulse">Synthesizing comprehensive picture from all history...</p>
                        </div>
                      ) : deepAnalysis ? (
                        <div className="space-y-12">
                          <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                            <h4 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-4">Synthesis Summary</h4>
                            <p className="text-slate-700 text-lg leading-relaxed font-medium">{deepAnalysis.summary}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {deepAnalysis.highlights.map((h, i) => (
                              <div key={i} className={`bg-${h.color}-50 p-8 rounded-[2.5rem] border border-${h.color}-100`}>
                                <h5 className={`font-black text-${h.color}-800 mb-2`}>{h.title}</h5>
                                <p className={`text-${h.color}-700/80 font-bold text-sm`}>{h.desc}</p>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-8">
                            <h4 className="text-xl font-black text-slate-900 border-l-4 border-slate-900 pl-4">Priority Actions</h4>
                            <div className="grid grid-cols-1 gap-4">
                              {deepAnalysis.actions.map((a, i) => (
                                <div key={i} className="flex gap-4 p-6 bg-blue-50/30 rounded-3xl border border-blue-100">
                                  <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-black">{i + 1}</div>
                                  <p className="font-bold text-slate-700 leading-relaxed">{a}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <Brain className="mx-auto text-slate-200 mb-6" size={80} />
                          <p className="text-slate-400 font-bold text-xl">Waiting for metrics to generate deep coaching...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 rounded-[4rem] text-white shadow-2xl">
                    <h4 className="text-xl font-black mb-8 border-b border-white/10 pb-4">Quick Observations</h4>
                    <div className="space-y-6">
                      {aiInsights.insights.map((insight, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
                          <div className={`text-${insight.color}-400 mt-1`}><insight.icon size={20} /></div>
                          <div>
                            <p className="font-black text-sm">{insight.title}</p>
                            <p className="text-xs text-slate-400 font-bold">{insight.desc}</p>
                          </div>
                        </div>
                      ))}
                      {aiInsights.insights.length === 0 && <p className="text-slate-500 font-bold text-sm italic">All basic vitals in range.</p>}
                    </div>
                  </div>
                </motion.div>
              )
            }
          </AnimatePresence >

          {/* Modal Overlay for Results */}
          < AnimatePresence >
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
                    {uploadedResult.type === 'medical_report' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                          <div className="bg-blue-600 text-white p-8 rounded-[3rem] shadow-2xl shadow-blue-500/10">
                            <h4 className="font-black text-xl mb-4 flex items-center gap-2 underline decoration-blue-400 decoration-4 underline-offset-8">Executive Summary</h4>
                            <p className="text-blue-50/90 leading-relaxed text-lg font-medium">{(uploadedResult.data || uploadedResult.result).summary}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ResultPanel title="Concerns" items={(uploadedResult.data || uploadedResult.result).concerns} color="rose" icon={AlertCircle} />
                            <ResultPanel title="Positives" items={(uploadedResult.data || uploadedResult.result).positives} color="emerald" icon={CheckCircle2} />
                          </div>
                        </div>

                        <div className="space-y-8">
                          <h4 className="text-xl font-black text-slate-900 border-l-4 border-slate-900 pl-4">Next Steps</h4>
                          <div className="space-y-4">
                            {(uploadedResult.data || uploadedResult.result).nextSteps.map((s, i) => (
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
                    )}

                    {uploadedResult.type === 'electrocardiogram' && (
                      <ECGWaveform data={uploadedResult.data || uploadedResult.result} />
                    )}

                    {uploadedResult.type === 'cda_document' && (
                      <div className="space-y-12">
                        <div className="flex items-center gap-6 mb-8">
                          <div className="bg-emerald-50 p-5 rounded-3xl text-emerald-600">
                            <ShieldCheck size={40} />
                          </div>
                          <div>
                            <h2 className="text-4xl font-black text-slate-900">{(uploadedResult.data || uploadedResult.result).title}</h2>
                            <p className="text-slate-400 font-bold text-lg">Structured Clinical Data Export</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(uploadedResult.data || uploadedResult.result).observations.map((obs, i) => (
                            <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl">
                              <p className="text-slate-400 text-[10px] font-black uppercase mb-1">{new Date(obs.date).toLocaleDateString()}</p>
                              <p className="text-lg font-black text-slate-800">{obs.name}</p>
                              <p className="text-2xl font-black text-emerald-600 mt-2">{obs.value} <span className="text-sm text-slate-400">{obs.unit}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadedResult.type === 'apple_health' && (
                      <div className="text-center py-20 px-10">
                        <div className="animate-float mb-10">
                          <CheckCircle2 className="mx-auto text-emerald-500 stroke-[3px]" size={100} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Data Synchronized!</h3>
                        <p className="text-slate-400 font-medium text-lg mb-10">Your health metrics have been analyzed and integrated into your dashboard.</p>
                        <button onClick={() => setUploadedResult(null)} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl">Confirm & View</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence >

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteConfirmOpen && (
              <motion.div
                key="delete-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
              >
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center scale-100 animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Delete {selectedIds.length} Records?</h3>
                  <p className="text-slate-500 font-medium mb-8">This action cannot be undone.</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkDeleteConfirm}
                      className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div >
      </main >
    </div >
  );
}

function VitalsCard({ icon: Icon, label, value, unit, color, context = "--" }) {
  const colors = {
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    orange: 'bg-orange-50 text-orange-600',
    lime: 'bg-lime-50 text-lime-600',
    green: 'bg-green-50 text-green-600',
    teal: 'bg-teal-50 text-teal-600',
    violet: 'bg-violet-50 text-violet-600',
    pink: 'bg-pink-50 text-pink-600'
  };

  return (
    <div className="glass-card p-6 rounded-[2.5rem] hover:shadow-xl transition-all border border-slate-50">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} shadow-sm`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
          <span className="text-[8px] font-bold text-slate-300 uppercase">{context}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
        <span className="text-xs font-bold text-slate-300 uppercase">{unit}</span>
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

const ECGWaveform = ({ data }) => {
  if (!data || !data.samples) return null;
  const chartData = data.samples.slice(0, 1000).map((val, idx) => ({ idx, val }));

  return (
    <div className="bg-slate-900 rounded-[3rem] p-10 text-white overflow-hidden relative">
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div>
          <h3 className="text-3xl font-black flex items-center gap-4">
            <div className="bg-rose-500 p-2.5 rounded-2xl text-white shadow-xl shadow-rose-500/20">
              <Heart size={24} fill="currentColor" />
            </div>
            ECG Rhythm: {data.metadata.classification}
          </h3>
          <p className="text-slate-400 font-bold mt-2">{data.metadata.date} • {data.leadName} • {data.metadata.hz}Hz</p>
        </div>
      </div>

      <div className="h-80 w-full mb-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <Line
              type="monotone"
              dataKey="val"
              stroke="#F43F5E"
              strokeWidth={2}
              dot={false}
              animationDuration={1500}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
              itemStyle={{ color: '#F43F5E' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Lead Name</p>
          <p className="text-xl font-black">{data.leadName}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Sample Rate</p>
          <p className="text-xl font-black">{data.metadata.hz} Hz</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Unit</p>
          <p className="text-xl font-black">{data.metadata.unit}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Symptoms</p>
          <p className="text-xl font-black text-slate-400">None Recorded</p>
        </div>
      </div>
      <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-rose-600/10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
};

export default App;
