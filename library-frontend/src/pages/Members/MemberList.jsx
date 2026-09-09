import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Copy, 
  Check, 
  LayoutGrid, 
  Table as TableIcon, 
  Sparkles, 
  RefreshCw, 
  UserCheck, 
  Calendar, 
  Mail, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import memberService from '../../api/memberService';
import { useAuth } from '../../context/AuthContext';
import MemberModal from './MemberModal';
import DeleteMemberModal from './DeleteMemberModal';

/**
 * Member Directory Dashboard Component.
 */
const MemberList = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const isLibrarian = role === 'LIBRARIAN';
  const canManageMembers = isAdmin || isLibrarian; // Role guard for Add/Edit
  const canDeleteMembers = isAdmin; // Role guard for Delete

  // Main data state
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);

  // Copied Email feedback state
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch members from backend
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      let response;
      if (debouncedSearch.trim()) {
        response = await memberService.searchMembers({
          name: debouncedSearch.trim(),
          page: currentPage,
          size: pageSize,
          sort: 'lastName',
        });
      } else {
        response = await memberService.getAllMembers({
          page: currentPage,
          size: pageSize,
          sort: 'lastName',
        });
      }

      setMembers(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Failed to load member list:', err);
      setFetchError(memberService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, currentPage, pageSize]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(0);
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const openDeleteModal = (member) => {
    setDeletingMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleMemberSaved = () => {
    showToast(editingMember ? 'Member profile updated successfully.' : 'New member registered successfully.');
    fetchMembers();
  };

  const handleMemberDeleted = () => {
    showToast('Member deactivated and removed from active list.', 'info');
    if (members.length === 1 && currentPage > 0) {
      setCurrentPage((p) => p - 1);
    } else {
      fetchMembers();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (first, last) => {
    const f = first?.[0] || 'M';
    const l = last?.[0] || '';
    return `${f}${l}`.toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === 'info'
              ? 'bg-white/95 border-cyan-200 text-cyan-800 shadow-slate-900/10'
              : 'bg-white/95 border-emerald-200 text-emerald-800 shadow-slate-900/10'
          }`}
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage.message}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Membership Directory &amp; Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Member Management
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {totalElements} {totalElements === 1 ? 'Member' : 'Members'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-medium">
            Manage registered library patrons, track membership dates, and administer user records.
          </p>
        </div>

        {/* Action Button (Guarded to ADMIN / LIBRARIAN) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMembers()}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-xs"
            title="Refresh member list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {canManageMembers && (
            <button
              onClick={openAddModal}
              id="add-member-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 ring-1 ring-indigo-500/30 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Registered</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{totalElements}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Directory Status</p>
            <p className="text-2xl font-extrabold text-emerald-700 tracking-tight">Active &amp; Verified</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Access Level</p>
            <p className="text-2xl font-extrabold text-purple-700 tracking-tight">{role || 'Standard'}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="w-full sm:max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="member-search-input"
              placeholder="Search by first or last name..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* View Toggle & Clear */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Table view"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cards grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {searchTerm && (
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {fetchError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900">Failed to load member directory</h4>
            <p className="text-xs text-rose-700 mt-0.5">{fetchError}</p>
          </div>
          <button
            onClick={fetchMembers}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-xs font-semibold text-rose-800 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 overflow-hidden shadow-xs">
          <div className="space-y-4">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3.5 border-b border-slate-100">
                <div className="h-10 w-10 bg-slate-100 rounded-xl animate-pulse shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ) : members.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">No members found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm
                ? `No library members match "${searchTerm}". Check the spelling or clear the filter.`
                : 'The member directory is currently empty. Register a new member to begin.'}
            </p>
          </div>
          {searchTerm ? (
            <button
              onClick={clearSearch}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
            >
              Clear Search Query
            </button>
          ) : canManageMembers ? (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register First Member</span>
            </button>
          ) : null}
        </div>
      ) : viewMode === 'table' ? (
        /* Data Table View */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4 sm:px-6">Member Details</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Membership Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {members.map((member) => {
                  const isActive = member.active !== false; // Default active

                  return (
                    <tr 
                      key={member.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Member Details */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 shrink-0 group-hover:border-indigo-400 transition-colors shadow-xs text-xs">
                            {getInitials(member.firstName, member.lastName)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                              {member.firstName} {member.lastName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono font-medium">
                              ID: #{member.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyEmail(member.email)}
                            className="group/email inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] text-slate-700 transition-colors cursor-pointer"
                            title="Click to copy email address"
                          >
                            <Mail className="h-3 w-3 text-slate-400 group-hover/email:text-indigo-600 shrink-0" />
                            <span>{member.email}</span>
                            {copiedEmail === member.email ? (
                              <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-400 group-hover/email:text-indigo-600 shrink-0" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Membership Date */}
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(member.membershipDate)}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-100'
                          }`}
                        >
                          <span 
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} 
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Role-Guarded Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Edit Button (ADMIN & LIBRARIAN only) */}
                          {canManageMembers && (
                            <button
                              onClick={() => openEditModal(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Member"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Button (ADMIN only) */}
                          {canDeleteMembers && (
                            <button
                              onClick={() => openDeleteModal(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Deactivate / Delete Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const isActive = member.active !== false;

            return (
              <div
                key={member.id}
                className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm shadow-xs">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                          {member.firstName} {member.lastName}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-mono font-medium">ID: #{member.id}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Email:
                      </span>
                      <button
                        onClick={() => handleCopyEmail(member.email)}
                        className="font-mono text-[11px] text-slate-700 hover:text-indigo-600 font-semibold transition-colors truncate max-w-[160px] cursor-pointer"
                        title="Click to copy email"
                      >
                        {member.email}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Member Since:
                      </span>
                      <span className="text-[11px] font-semibold">{formatDate(member.membershipDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Patron Record</span>
                  <div className="flex items-center gap-1">
                    {canManageMembers && (
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {canDeleteMembers && (
                      <button
                        onClick={() => openDeleteModal(member)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          {/* Summary & Page Size Selector */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>
              Showing <span className="font-bold text-slate-900">{members.length === 0 ? 0 : currentPage * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalElements}</span> members
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Triggers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0 || loading}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page indicator */}
            <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
              Page <span className="text-indigo-600 font-bold">{currentPage + 1}</span> of{' '}
              <span className="text-slate-900 font-bold">{Math.max(1, totalPages)}</span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSuccess={handleMemberSaved}
        editingMember={editingMember}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMemberModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleMemberDeleted}
        member={deletingMember}
      />
    </div>
  );
};

export default MemberList;

