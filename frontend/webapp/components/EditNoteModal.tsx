import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, Loader2, Check, Trash2 } from 'lucide-react';
import { patientsApi, UpdateNoteRequest } from '../api/patients';
import type { ClinicalNote } from '../types';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  note: ClinicalNote | null;
  onNoteUpdated: (note: ClinicalNote) => void;
  onNoteDeleted: (noteId: string) => void;
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  patientId,
  note,
  onNoteUpdated,
  onNoteDeleted,
}) => {
  const [content, setContent] = useState('');
  const [visitType, setVisitType] = useState<'regular' | 'follow-up' | 'emergency'>('regular');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<'updated' | 'deleted' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setVisitType(note.visit_type);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Note content is required');
      return;
    }

    if (!note) return;

    setIsSubmitting(true);

    try {
      const noteData: UpdateNoteRequest = {
        content: content.trim(),
        visit_type: visitType,
      };

      const updatedNote = await patientsApi.updateNote(patientId, note.id, noteData);
      setSuccess('updated');

      setTimeout(() => {
        onNoteUpdated(updatedNote);
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { status: number; data?: { detail?: string } } };
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Note not found. It may have been deleted.');
      } else if (error.response?.status === 422) {
        setError('Invalid note data. Please check your input.');
      } else {
        setError('Failed to update note. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    setIsDeleting(true);
    setError(null);

    try {
      await patientsApi.deleteNote(patientId, note.id);
      setSuccess('deleted');

      setTimeout(() => {
        onNoteDeleted(note.id);
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Note not found. It may have already been deleted.');
      } else {
        setError('Failed to delete note. Please try again.');
      }
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setVisitType('regular');
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !note) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 animate-fadeIn text-center">
          <div className={`w-16 h-16 ${success === 'deleted' ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {success === 'deleted' ? (
              <Trash2 className="w-8 h-8 text-red-600" />
            ) : (
              <Check className="w-8 h-8 text-green-600" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {success === 'deleted' ? 'Note Deleted' : 'Note Updated'}
          </h3>
          <p className="text-gray-500">
            {success === 'deleted'
              ? 'Clinical note has been removed.'
              : 'Clinical note has been updated successfully.'}
          </p>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fadeIn">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Note?</h3>
            <p className="text-gray-500">
              This action cannot be undone. The clinical note will be permanently removed.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Note'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Clinical Note</h2>
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(note.created_at).toLocaleDateString()}
            </p>
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
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
              className="py-3 px-4 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNoteModal;
