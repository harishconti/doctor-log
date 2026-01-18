import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import { patientsApi } from '../api/patients';
import type { ClinicalNote } from '../types';
import CreateNoteModal from './CreateNoteModal';
import EditNoteModal from './EditNoteModal';

interface ClinicalNotesListProps {
  patientId: string;
  patientName: string;
}

const ClinicalNotesList: React.FC<ClinicalNotesListProps> = ({ patientId, patientName }) => {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);

  const pageSize = 20;

  const fetchNotes = async (page: number = currentPage) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await patientsApi.getNotes(patientId, {
        page,
        page_size: pageSize,
      });

      setNotes(response.items);
      setTotalPages(response.total_pages);
      setTotalNotes(response.total);
      setCurrentPage(response.page);
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load clinical notes. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(1);
  }, [patientId]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchNotes(newPage);
    }
  };

  const handleNoteCreated = (newNote: ClinicalNote) => {
    // Refresh the list to show the new note
    fetchNotes(1);
    setIsCreateModalOpen(false);
  };

  const handleNoteUpdated = (updatedNote: ClinicalNote) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    );
    setIsEditModalOpen(false);
    setSelectedNote(null);
  };

  const handleNoteDeleted = (noteId: string) => {
    // Refresh the list after deletion
    fetchNotes(currentPage);
    setIsEditModalOpen(false);
    setSelectedNote(null);
  };

  const handleEditNote = (note: ClinicalNote) => {
    setSelectedNote(note);
    setIsEditModalOpen(true);
  };

  const getVisitTypeBadge = (visitType: ClinicalNote['visit_type']) => {
    switch (visitType) {
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'follow-up':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  // Loading skeleton
  const NotesSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-xl border border-gray-100 animate-pulse"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-5 bg-gray-200 rounded-full" />
              <div className="w-32 h-4 bg-gray-200 rounded" />
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded" />
            <div className="w-3/4 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Clinical Notes</h3>
          {!isLoading && (
            <span className="text-sm text-gray-500">({totalNotes} total)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNotes(currentPage)}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Add Note
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <NotesSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchNotes(currentPage)}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Try Again
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Clinical Notes</h4>
            <p className="text-gray-500 mb-6 max-w-sm">
              Start documenting patient visits by adding your first clinical note.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
            >
              <Plus size={18} />
              Add First Note
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVisitTypeBadge(
                        note.visit_type
                      )}`}
                    >
                      {note.visit_type === 'follow-up'
                        ? 'Follow-up'
                        : note.visit_type.charAt(0).toUpperCase() + note.visit_type.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit note"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
                {note.updated_at !== note.created_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Edited {formatDate(note.updated_at)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && notes.length > 0 && totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalNotes)} of {totalNotes} notes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                  <button
                    key={index}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-brand-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="px-1 text-gray-400">
                    {page}
                  </span>
                )
              )}
            </div>
            <span className="sm:hidden text-sm text-gray-600 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        patientId={patientId}
        patientName={patientName}
        onNoteCreated={handleNoteCreated}
      />

      <EditNoteModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedNote(null);
        }}
        patientId={patientId}
        note={selectedNote}
        onNoteUpdated={handleNoteUpdated}
        onNoteDeleted={handleNoteDeleted}
      />
    </div>
  );
};

export default ClinicalNotesList;
