import { useEffect, useState } from 'react';
import { memberApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit, X } from 'lucide-react';
import './Members.css';

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  membershipDate: string;
}

interface MemberForm {
  firstName: string;
  lastName: string;
  email: string;
  membershipDate: string;
}

const EMPTY_FORM: MemberForm = {
  firstName: '',
  lastName: '',
  email: '',
  membershipDate: '',
};

const Members = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [version, setVersion] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = searchTerm.trim()
          ? await memberApi.search(searchTerm, currentPage)
          : await memberApi.getAll(currentPage);
        if (!cancelled) {
          setMembers(response.data.content);
          setTotalPages(response.data.totalPages);
        }
      } catch (err) {
        if (!cancelled) console.error('Error loading members:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchTerm, currentPage, version]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setForm({ ...EMPTY_FORM, membershipDate: new Date().toISOString().split('T')[0] });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      membershipDate: member.membershipDate,
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        membershipDate: form.membershipDate,
      };
      if (editingMember) {
        await memberApi.update(editingMember.id, payload);
      } else {
        await memberApi.add(payload);
      }
      closeModal();
      setVersion(v => v + 1);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'An error occurred. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await memberApi.delete(id);
      setDeletingId(null);
      if (members.length === 1 && currentPage > 0) {
        setCurrentPage(p => p - 1);
      } else {
        setVersion(v => v + 1);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="page">
      <header className="page-header section-header">
        <div>
          <h1>Members</h1>
          <p>Browse and manage all library members.</p>
        </div>
        <button className="add-btn" onClick={openAddModal}>
          <Plus size={20} />
          <span>Add New Member</span>
        </button>
      </header>

      <div className="table-actions">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => handleSearchChange('')} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="loading">No members found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Member Since</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>#{member.id}</td>
                  <td className="member-name">{member.firstName} {member.lastName}</td>
                  <td className="member-email">{member.email}</td>
                  <td>{formatDate(member.membershipDate)}</td>
                  <td className="actions">
                    <button className="icon-btn edit" title="Edit" onClick={() => openEditModal(member)}>
                      <Edit size={18} />
                    </button>
                    {isAdmin && (deletingId === member.id ? (
                      <>
                        <button
                          className="icon-btn delete"
                          title="Confirm delete"
                          onClick={() => handleDelete(member.id)}
                          style={{ color: 'var(--danger)', fontWeight: 700 }}
                        >
                          ✓
                        </button>
                        <button className="icon-btn" title="Cancel" onClick={() => setDeletingId(null)}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button className="icon-btn delete" title="Delete" onClick={() => setDeletingId(member.id)}>
                        <Trash2 size={18} />
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="page-info">Page {currentPage + 1} of {totalPages}</span>
          <button
            className="page-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleFormChange}
                    required
                    placeholder="First name"
                  />
                </div>

                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleFormChange}
                    required
                    placeholder="Last name"
                  />
                </div>

                <div className="form-group span-2">
                  <label>Email <span className="required">*</span></label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    placeholder="member@example.com"
                  />
                </div>

                <div className="form-group span-2">
                  <label>Membership Date <span className="required">*</span></label>
                  <input
                    name="membershipDate"
                    type="date"
                    value={form.membershipDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
