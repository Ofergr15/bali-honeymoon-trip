import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Crown, Shield, Edit, Eye } from 'lucide-react';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'super_user' | 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const ROLE_ICONS = {
  super_user: <Crown className="w-4 h-4 text-yellow-600" />,
  admin: <Shield className="w-4 h-4 text-purple-600" />,
  editor: <Edit className="w-4 h-4 text-blue-600" />,
  viewer: <Eye className="w-4 h-4 text-gray-600" />,
};

const ROLE_LABELS = {
  super_user: 'Super User',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_COLORS = {
  super_user: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  editor: 'bg-blue-50 text-blue-700 border-blue-200',
  viewer: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function UserManagement({ isSuperUser }: { isSuperUser: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserStatus(userId: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      // TODO: Send email notification if approved
      if (status === 'approved') {
        await sendApprovalEmail(userId);
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  }

  async function updateUserRole(userId: string, role: User['role']) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  }

  async function sendApprovalEmail(userId: string) {
    // TODO: Implement email sending via Supabase Edge Function or Resend
    console.log('TODO: Send approval email to user', userId);
  }

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingUsers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              {pendingUsers.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.display_name || user.email}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateUserStatus(user.id, 'approved')}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => updateUserStatus(user.id, 'rejected')}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Users */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Approved Users ({approvedUsers.length})
        </h3>
        <div className="space-y-2">
          {approvedUsers.map(user => {
            const isSelf = user.id === currentUser?.id;
            const canChangeRole = isSuperUser || (user.role !== 'super_user' && user.role !== 'admin');

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {user.display_name || user.email}
                      </span>
                      {isSelf && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${ROLE_COLORS[user.role]}`}>
                    {ROLE_ICONS[user.role]}
                    <span className="text-sm font-medium">{ROLE_LABELS[user.role]}</span>
                  </div>

                  {/* Role Change Dropdown (only for super_user) */}
                  {canChangeRole && !isSelf && (
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as User['role'])}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-travel-teal"
                    >
                      {isSuperUser && <option value="admin">Admin</option>}
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}

                  {/* Remove Access (only for non-self, non-super_user) */}
                  {!isSelf && user.role !== 'super_user' && (
                    <button
                      onClick={() => updateUserStatus(user.id, 'rejected')}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Rejected Users ({rejectedUsers.length})
          </h3>
          <div className="space-y-2">
            {rejectedUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">
                      {user.display_name || user.email}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => updateUserStatus(user.id, 'approved')}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Re-approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Role Permissions:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong>Super User:</strong> Full control, can promote to Admin</li>
              <li><strong>Admin:</strong> Manage users, view & edit trip</li>
              <li><strong>Editor:</strong> View & edit trip data</li>
              <li><strong>Viewer:</strong> View trip data only (read-only)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
