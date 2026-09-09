import { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import { Plus, Trash2, X, Mail, Lock, User, ShieldCheck, Users as UsersIcon, AlertCircle, Loader2 } from 'lucide-react';
import './Users.css';

interface SystemUser {
  id: number;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  LIBRARIAN: 'Librarian',
  USER: 'User',
};

const EMPTY_FORM = { email: '', password: '', role: 'USER' };

const Users = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await userApi.getAll();
      setUsers(res.data);
    } catch (err: any) {
      setFetchError(err.response?.data?.message ?? `Error ${err.response?.status ?? ''}: failed to load users.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await userApi.create(form);
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Failed to create user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id);
      setDeletingId(null);
      fetchUsers();
    } catch {
      // handled silently
    }
  };

  const roleClass = (role: string) =>
    role === 'ADMIN' ? 'role-badge admin' : role === 'LIBRARIAN' ? 'role-badge librarian' : 'role-badge user';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <UsersIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Users</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage system administrators, librarians, and patron accounts.
          </p>
        </div>

        <button 
          id="add-user-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all duration-200 active:scale-95 cursor-pointer" 
          onClick={openModal}
        >
          <Plus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{fetchError}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Loading system users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
              <UsersIcon className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-800">No users found</p>
            <p className="text-xs text-slate-500">Get started by creating your first system user account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-900 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">System Role</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 flex items-center justify-center text-xs">
                          {u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-semibold text-slate-900">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={roleClass(u.role)}>{ROLE_LABELS[u.role] ?? u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {deletingId === u.id ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Confirm delete"
                            onClick={() => handleDelete(u.id)}
                          >
                            Confirm Delete
                          </button>
                          <button 
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
                            title="Cancel" 
                            onClick={() => setDeletingId(null)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                          title="Delete user" 
                          onClick={() => setDeletingId(u.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={closeModal}>
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
                  <p className="text-xs text-slate-500">Create login credentials and assign role</p>
                </div>
              </div>
              <button className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                <div className="users-input-wrapper">
                  <Mail size={16} className="users-input-icon" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Password <span className="text-rose-500">*</span></label>
                <div className="users-input-wrapper">
                  <Lock size={16} className="users-input-icon" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Role <span className="text-rose-500">*</span></label>
                <div className="users-input-wrapper">
                  <User size={16} className="users-input-icon" />
                  <select name="role" value={form.role} onChange={handleFormChange}>
                    <option value="USER">User (Patron)</option>
                    <option value="LIBRARIAN">Librarian (Circulation)</option>
                    <option value="ADMIN">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer" onClick={closeModal}>Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
