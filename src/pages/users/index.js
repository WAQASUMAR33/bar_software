import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', password: '', role: 'cashier' };

const ROLE_BADGE = { admin: 'badge-danger', manager: 'badge-warning', cashier: 'badge-info' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchUsers(); fetchLogs(); }, []);

  async function fetchUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function fetchLogs() {
    const res = await fetch('/api/activity-logs');
    const data = await res.json();
    setLogs(data.logs || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/users/${editId}` : '/api/users';
      const method = editId ? 'PUT' : 'POST';
      const body = editId && !form.password ? { name: form.name, email: form.email, role: form.role } : form;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editId ? 'User updated' : 'User created');
      setOpen(false); setForm(EMPTY); setEditId(null); fetchUsers();
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function handleDelete() {
    await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
    toast.success('User deactivated');
    setDeleteId(null);
    fetchUsers();
  }

  function openEdit(u) {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditId(u.id);
    setOpen(true);
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex gap-3 border-b border-gray-200 mb-4">
          {['users', 'activity'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'users' ? 'Users & Roles' : 'Activity Logs'}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <>
            <div className="flex justify-end">
              <button onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }} className="btn btn-primary">+ Add User</button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${ROLE_BADGE[u.role]} capitalize`}>{u.role}</span></td>
                      <td><span className={`badge ${u.active ? 'badge-success' : 'badge-gray'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(u)} className="btn btn-secondary btn-sm">Edit</button>
                          <button onClick={() => setDeleteId(u.id)} className="btn btn-danger btn-sm">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Description</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="text-xs">{formatDate(l.createdAt, 'dd MMM HH:mm')}</td>
                    <td>{l.user?.name}</td>
                    <td><span className="badge badge-gray text-xs">{l.action}</span></td>
                    <td className="text-xs text-gray-500 max-w-xs truncate">{l.description}</td>
                    <td className="text-xs text-gray-400">{l.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editId ? 'Edit User' : 'Add User'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Full Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" required={!editId} minLength={6} />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : editId ? 'Update' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Deactivate User" message="Deactivate this user account?" confirmText="Deactivate" />
    </Layout>
  );
}

UsersPage.getLayout = (page) => page;
