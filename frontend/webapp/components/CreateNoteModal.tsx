import React, { useState } from 'react';
import { X, FileText, AlertCircle, Loader2, Check } from 'lucide-react';
import { patientsApi, CreateNoteRequest } from '../api/patients';
import type { ClinicalNote } from '../types';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onNoteCreated: (note: ClinicalNote) => void;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onNoteCreated,
}) => {
  const [content, setContent] = useState('');
  const [visitType, setVisitType] = useState<'regular' | 'follow-up' | 'emergency'>('regular');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Note content is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const noteData: CreateNoteRequest = {
        content: content.trim(),
        visit_type: visitType,
      };

      const newNote = await patientsApi.createNote(patientId, noteData);
      setSuccess(true);

      setTimeout(() => {
        onNoteCreated(newNote);
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { status: number; data?: { detail?: string } } };
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (error.response?.status === 422) {
        setError('Invalid note data. Please check your input.');
      } else {
        setError('Failed to create note. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setVisitType('regular');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 animate-fadeIn text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Note Created</h3>
          <p className="text-gray-500">Clinical note has been added successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Clinical Note</h2>
            <p className="text-sm text-gray-500 mt-1">For {patientName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Visit Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visit Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['regular', 'follow-up', 'emergency'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisitType(type)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                    visitType === type
                      ? type === 'emergency'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : type === 'follow-up'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-brand-50 border-brand-300 text-brand-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type === 'follow-up' ? 'Follow-up' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Note Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Content
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FileText size={18} />
              </div>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter clinical notes, observations, diagnosis, treatment plan..."
                rows={8}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                  error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-brand-500 focus:ring-brand-200'
                }`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {content.length} characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNoteModal;
