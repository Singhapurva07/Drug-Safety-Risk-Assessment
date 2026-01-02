import React, { useState } from 'react';
import { Activity, AlertCircle, Brain, CheckCircle, Heart, Info, Loader2, Sparkles, TrendingUp } from 'lucide-react';

// Main App Component
export default function MediVisionApp() {
  const [activeTab, setActiveTab] = useState('predict');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {activeTab === 'predict' && (
          <PredictTab 
            result={result}
            setResult={setResult}
            loading={loading}
            setLoading={setLoading}
            error={error}
            setError={setError}
          />
        )}
        {activeTab === 'about' && <AboutTab />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Header Component
function Header({ activeTab, setActiveTab }) {
  return (
    <header className="bg-white shadow-lg border-b-4 border-blue-600">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl shadow-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                MediVision
              </h1>
              <p className="text-sm text-gray-600">AI-Powered Pharmacovigilance</p>
            </div>
          </div>
          
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('predict')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'predict'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              Predict
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'about'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              About
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

// Predict Tab Component
function PredictTab({ result, setResult, loading, setLoading, error, setError }) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wider">Explainable AI</span>
            </div>
            <h2 className="text-4xl font-bold">Drug Safety Risk Assessment</h2>
            <p className="text-blue-100 text-lg max-w-2xl">
              Advanced machine learning models analyze FDA FAERS data to predict organ-specific adverse event risks with transparent explanations.
            </p>
          </div>
          <div className="hidden lg:block">
            <Brain className="w-32 h-32 text-blue-300 opacity-50" />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <StatCard icon={<Activity className="w-5 h-5" />} label="Multi-Organ Analysis" value="3 Organs" />
          <StatCard icon={<Brain className="w-5 h-5" />} label="AI Models" value="LightGBM + XGBoost" />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Data Source" value="FDA FAERS" />
        </div>
      </div>

      {/* Input Form */}
      <DrugInputForm 
        setResult={setResult}
        setLoading={setLoading}
        setError={setError}
      />

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {error && <ErrorState error={error} setError={setError} />}

      {/* Results */}
      {result && !loading && <PredictionResult result={result} />}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
      <div className="flex items-center space-x-3">
        <div className="text-white">{icon}</div>
        <div>
          <p className="text-xs text-blue-200">{label}</p>
          <p className="text-sm font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Drug Input Form Component
function DrugInputForm({ setResult, setLoading, setError }) {
  const [form, setForm] = useState({
    age: '',
    sex: 'UNK',
    reporter_type: 'UNK',
    drug_count: 1,
    reaction_count: 0,
    serious_outcome: 0,
    polypharmacy: 0,
    route: 'UNKNOWN',
    dose_bin: 'Unknown',
    indication: 'UNKNOWN',
    active_ingredient: '',
    explanation_mode: 'clinical'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };
    
    if (name === 'drug_count') {
      updates.polypharmacy = Number(value) > 1 ? 1 : 0;
    }
    
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    if (!form.active_ingredient.trim()) {
      setError("Please enter the drug name");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: form.age === '' ? null : Number(form.age),
          sex: form.sex,
          reporter_type: form.reporter_type,
          drug_count: Number(form.drug_count),
          reaction_count: Number(form.reaction_count),
          serious_outcome: Number(form.serious_outcome),
          polypharmacy: Number(form.polypharmacy),
          route: form.route,
          dose_bin: form.dose_bin,
          indication: form.indication,
          active_ingredient: form.active_ingredient,
          explanation_mode: form.explanation_mode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction from server');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err.message || "Could not connect to backend. Make sure the server is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Patient Information</h3>
        <p className="text-gray-600">Enter patient and drug details for risk assessment</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Age */}
          <FormField label="Age (years)" name="age" type="number" value={form.age} onChange={handleChange} placeholder="e.g. 45" />
          
          {/* Sex */}
          <FormSelect label="Sex" name="sex" value={form.sex} onChange={handleChange}>
            <option value="UNK">Unknown</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </FormSelect>

          {/* Drug Count */}
          <FormField 
            label="Number of Drugs" 
            name="drug_count" 
            type="number" 
            value={form.drug_count} 
            onChange={handleChange}
            min="1"
            badge={form.drug_count > 1 && "Polypharmacy detected"}
          />

          {/* Route */}
          <FormField label="Route of Administration" name="route" value={form.route} onChange={handleChange} placeholder="e.g. Oral" />
        </div>

        {/* Active Ingredient */}
        <FormField 
          label="Active Ingredient / Drug Name" 
          name="active_ingredient" 
          value={form.active_ingredient} 
          onChange={handleChange} 
          placeholder="e.g. Paracetamol, Ibuprofen"
          required
        />

        {/* Explanation Mode */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Explanation Mode</label>
          <div className="flex flex-wrap gap-4">
            <RadioButton
              name="explanation_mode"
              value="clinical"
              checked={form.explanation_mode === 'clinical'}
              onChange={handleChange}
              label="Clinical (Healthcare Professionals)"
            />
            <RadioButton
              name="explanation_mode"
              value="educational"
              checked={form.explanation_mode === 'educational'}
              onChange={handleChange}
              label="Educational (Patients)"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Analyze Risk Profile</span>
        </button>
      </div>
    </div>
  );
}

// Form Field Component
function FormField({ label, name, type = "text", value, onChange, placeholder, required, min, badge }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
      />
      {badge && <p className="text-xs text-amber-600 mt-2 flex items-center"><Info className="w-3 h-3 mr-1" /> {badge}</p>}
    </div>
  );
}

// Form Select Component
function FormSelect({ label, name, value, onChange, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
      >
        {children}
      </select>
    </div>
  );
}

// Radio Button Component
function RadioButton({ name, value, checked, onChange, label }) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mt-6">Analyzing Risk Profile</h3>
        <p className="text-gray-600 mt-2">Processing through ML models and AI reasoning engine</p>
        <div className="flex space-x-2 mt-6">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ error, setError }) {
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
      <div className="flex items-start space-x-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-900">Error</h3>
          <p className="text-red-800 mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-3 text-red-700 hover:text-red-900 font-semibold text-sm underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// Prediction Result Component
function PredictionResult({ result }) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [loadingDetailed, setLoadingDetailed] = useState(false);

  const getRiskColor = (score) => {
    if (score >= 65) return { bg: 'from-red-50 to-red-100', text: 'text-red-600', border: 'border-red-300' };
    if (score >= 35) return { bg: 'from-amber-50 to-amber-100', text: 'text-amber-600', border: 'border-amber-300' };
    return { bg: 'from-emerald-50 to-emerald-100', text: 'text-emerald-600', border: 'border-emerald-300' };
  };

  const riskColor = getRiskColor(result.overall_risk_score);

  const fetchDetailedAnalysis = async () => {
    setLoadingDetailed(true);
    try {
      // ✅ FIXED: Include drug_name in payload
      const payload = {
        predictions: result.predictions,
        overall_risk_score: result.overall_risk_score,
        primary_driver: result.primary_driver,
        confidence: result.confidence,
        drug_class: result.drug_class,
        drug_name: result.drug_name // ✅ Added drug_name
      };

      const response = await fetch('http://localhost:8000/detailed-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch detailed analysis');
      }
      
      const data = await response.json();
      setDetailedAnalysis(data.detailed_explanation);
      setShowDetailed(true);
    } catch (error) {
      console.error('Failed to fetch detailed analysis:', error);
      setDetailedAnalysis(`Failed to load detailed analysis: ${error.message}`);
      setShowDetailed(true);
    } finally {
      setLoadingDetailed(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk Card */}
      <div className={`bg-gradient-to-br ${riskColor.bg} rounded-3xl p-8 border-2 ${riskColor.border} shadow-2xl`}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h3 className="text-3xl font-bold text-gray-900">Risk Assessment Summary</h3>
          <span className="px-4 py-2 bg-white rounded-full text-sm font-bold text-gray-700 shadow-lg">
            {result.confidence} Confidence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Overall Risk Score"
            value={`${result.overall_risk_score}%`}
            subtitle="Weighted assessment"
            color={riskColor.text}
            large
          />
          <MetricCard
            label="Primary Risk Driver"
            value={result.primary_driver}
            subtitle="Main concern"
          />
          <MetricCard
            label="Drug Classification"
            value={result.drug_class}
            subtitle="Therapeutic class"
          />
        </div>
      </div>

      {/* Organ Risk Cards */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Heart className="w-6 h-6 mr-2 text-blue-600" />
          Organ-Specific Risk Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(result.predictions).map(([organ, data]) => (
            <OrganRiskCard key={organ} organ={organ} data={data} />
          ))}
        </div>
      </div>

      {/* AI Explanation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-indigo-600" />
          Clinical Interpretation
        </h3>
        <div className="bg-white rounded-2xl p-6 text-gray-800 leading-relaxed">
          {result.default_explanation}
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border-2 border-slate-300 shadow-xl">
        {!showDetailed ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Risk Analysis</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Request a comprehensive analysis including identified issues, possible consequences, 
              risk pathways, and detailed monitoring recommendations.
            </p>
            <button
              onClick={fetchDetailedAnalysis}
              disabled={loadingDetailed}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loadingDetailed ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Analysis...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  View Detailed Risk Analysis
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-bold text-gray-900">Detailed Risk Analysis</h3>
              <button
                onClick={() => setShowDetailed(false)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Hide Analysis
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 text-gray-800 leading-relaxed border-2 border-slate-200 shadow-md">
              <div className="whitespace-pre-wrap">{detailedAnalysis}</div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900 mb-1">MEDICAL DISCLAIMER</p>
            <p className="text-sm text-red-800">{result.disclaimer} Always consult healthcare professionals for medical decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, subtitle, color = 'text-gray-900', large }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`${large ? 'text-5xl' : 'text-2xl'} font-bold ${color} mb-1`}>{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

// Organ Risk Card Component
function OrganRiskCard({ organ, data }) {
  const getRiskStyle = (level) => {
    if (level === 'High') return { bg: 'from-red-500 to-red-600', badge: 'bg-red-100 text-red-800' };
    if (level === 'Moderate') return { bg: 'from-amber-500 to-amber-600', badge: 'bg-amber-100 text-amber-800' };
    return { bg: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-100 text-emerald-800' };
  };

  const style = getRiskStyle(data.risk_level);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-gray-900 capitalize">{organ.toLowerCase()}</h4>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
          {data.risk_level}
        </span>
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-4">
        {(data.probability * 100).toFixed(1)}%
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${style.bg} transition-all duration-1000`}
          style={{ width: `${data.probability * 100}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-3 font-medium">FAERS-based probability</p>
    </div>
  );
}

// About Tab Component
function AboutTab() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">About MediVision</h2>
      <div className="space-y-4 text-gray-700">
        <p className="text-lg">
          MediVision is an AI-powered pharmacovigilance platform that combines FDA FAERS adverse event data
          with advanced machine learning models to provide transparent drug safety risk assessments.
        </p>
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Technology Stack</h3>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>ML Models:</strong> LightGBM and XGBoost for multi-organ risk prediction</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>AI Explanation:</strong> Groq LLaMA 3.1 for interpretable clinical insights</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Data Source:</strong> FDA FAERS (Adverse Event Reporting System)</span>
            </li>
          </ul>
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Features</h3>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Multi-organ risk assessment (Liver, Kidney, Lung)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Explainable AI with clinical and educational modes</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Real-time risk scoring with confidence metrics</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Polypharmacy risk detection</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">MediVision v2.0 - Clinical Decision Support Platform</p>
          <p>Powered by LightGBM · XGBoost · Groq LLaMA 3.1 · FDA FAERS</p>
          <p className="text-xs mt-2 text-gray-500">Not a substitute for professional medical judgment</p>
        </div>
      </div>
    </footer>
  );
}