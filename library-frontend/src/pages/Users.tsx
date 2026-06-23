import { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import { Plus, Trash2, X, Mail, Lock, User } from 'lucide-react';
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
    <div className="page">
      <header className="page-header section-header">
        <div>
          <h1>System Users</h1>
          <p>Manage librarians and user accounts.</p>
        </div>
        <button className="add-btn" onClick={openModal}>
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </header>

      {fetchError && <div className="form-error" style={{ marginBottom: '1rem' }}>{fetchError}</div>}

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="loading">No users found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td className="user-email">{u.email}</td>
                  <td>
                    <span className={roleClass(u.role)}>{ROLE_LABELS[u.role] ?? u.role}</span>
                  </td>
                  <td className="actions">
                    {deletingId === u.id ? (
                      <>
                        <button
                          className="icon-btn delete"
                          title="Confirm delete"
                          onClick={() => handleDelete(u.id)}
                          style={{ color: 'var(--danger)', fontWeight: 700 }}
                        >
                          ✓
                        </button>
                        <button className="icon-btn" title="Cancel" onClick={() => setDeletingId(null)}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button className="icon-btn delete" title="Delete" onClick={() => setDeletingId(u.id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
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

              <div className="form-group">
                <label>Password <span className="required">*</span></label>
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

              <div className="form-group">
                <label>Role <span className="required">*</span></label>
                <div className="users-input-wrapper">
                  <User size={16} className="users-input-icon" />
                  <select name="role" value={form.role} onChange={handleFormChange}>
                    <option value="USER">User</option>
                    <option value="LIBRARIAN">Librarian</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
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
