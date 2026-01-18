import React, { useState } from 'react';
import { Patient } from '../types';
import { generatePatientSummary } from '../services/geminiService';
import { Sparkles, FileText, Activity, X, PenSquare, User } from 'lucide-react';
import ClinicalNotesList from './ClinicalNotesList';

interface PatientCardProps {
  patient: Patient;
  onClose: () => void;
  onEdit?: (patient: Patient) => void;
}

type TabType = 'overview' | 'notes';

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClose, onEdit }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const result = await generatePatientSummary(patient);
    setSummary(result);
    setIsGenerating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'Recovering': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  // Simple Markdown renderer replacement since we can't easily install react-markdown in this constraints
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
        if (line.startsWith('**')) return <h4 key={i} className="font-bold mt-2 mb-1">{line.replace(/\*\*/g, '')}</h4>;
        if (line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-gray-700">{line.replace('* ', '')}</li>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700">{line.replace('- ', '')}</li>;
        if (line.trim() === '') return <br key={i}/>;
        return <p key={i} className="mb-1 text-gray-700">{line}</p>;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              {patient.status && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <span>ID: {patient.patient_id || patient.id}</span>
              {patient.age && <><span>•</span><span>{patient.age} yrs</span></>}
              {patient.gender && <><span>•</span><span className="capitalize">{patient.gender}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(patient)}
                className="text-gray-400 hover:text-brand-600 hover:bg-brand-50 p-2 rounded-lg transition-colors"
                title="Edit patient"
              >
                <PenSquare size={20} />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 -mb-6 mt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-brand-600 border border-gray-200 border-b-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User size={16} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'bg-white text-brand-600 border border-gray-200 border-b-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText size={16} />
            Clinical Notes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold">
                  <Activity size={18} />
                  <h3>Current Condition</h3>
                </div>
                <p className="text-gray-800 font-medium">{patient.condition || patient.initial_complaint || 'No condition recorded'}</p>
                {patient.lastVisit && (
                  <p className="text-sm text-gray-500 mt-1">Last Visit: {patient.lastVisit}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                  <FileText size={18} />
                  <h3>Quick Notes</h3>
                </div>
                <p className="text-gray-600 text-sm italic">
                  {patient.notes ? `"${patient.notes}"` : 'No quick notes available. View Clinical Notes tab for full history.'}
                </p>
              </div>
            </div>

            {/* AI Section */}
            <div className="mt-6">
              {!summary ? (
                <div className="border-2 border-dashed border-brand-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-brand-50/30">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4 text-brand-600">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Smart Summary</h3>
                  <p className="text-gray-500 max-w-sm mb-6">
                    Use Gemini AI to analyze clinical notes, identify risk factors, and suggest next steps.
                  </p>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Analyzing Data...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate Insights
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-50 to-white px-6 py-4 border-b border-brand-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-brand-800 font-semibold">
                      <Sparkles size={18} className="text-brand-500" />
                      AI Clinical Analysis
                    </div>
                    <span className="text-xs text-brand-400 font-medium bg-white px-2 py-1 rounded border border-brand-100">
                      Powered by Gemini
                    </span>
                  </div>
                  <div className="p-6 prose prose-blue max-w-none text-sm leading-relaxed">
                    {renderMarkdown(summary)}
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => setSummary(null)}
                      className="text-gray-500 text-sm hover:text-gray-700 font-medium"
                    >
                      Clear Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <ClinicalNotesList patientId={patient.id} patientName={patient.name} />
        )}
      </div>
    </div>
  );
};

export default PatientCard;
