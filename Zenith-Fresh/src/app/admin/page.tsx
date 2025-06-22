'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  sessionId: string;
  user: {
    username: string;
    role: string;
    name: string;
  };
  features: {
    role: string;
    roleName: string;
    accessLevel: string;
    features: Record<string, any>;
  };
}

interface StaffUser {
  username: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  active: boolean;
}

interface ActiveSession {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff_tester'
  });

  useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      const sessionData = localStorage.getItem('zenith_session');
      if (!sessionData) {
        router.push('/auth/signin');
        return;
      }

      const parsedSession = JSON.parse(sessionData);
      setSession(parsedSession);

      // Check if user is master admin
      if (parsedSession.user.role !== 'master_admin') {
        setError('Access denied. Master admin required.');
        return;
      }

      // Load staff users and active sessions
      await Promise.all([loadStaffUsers(), loadActiveSessions()]);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffUsers = async () => {
    try {
      const sessionData = JSON.parse(localStorage.getItem('zenith_session') || '{}');
      const response = await fetch(`/api/users?action=list&sessionId=${sessionData.sessionId}`);
      const data = await response.json();

      if (data.success) {
        setStaffUsers(data.users);
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Failed to load staff users:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const sessionData = JSON.parse(localStorage.getItem('zenith_session') || '{}');
      const response = await fetch(`/api/users?action=sessions&sessionId=${sessionData.sessionId}`);
      const data = await response.json();

      if (data.success) {
        setActiveSessions(data.sessions);
      } else {
        console.error('Failed to load sessions:', data.error);
      }
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = JSON.parse(localStorage.getItem('zenith_session') || '{}');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          action: 'create',
          userData: newUser
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewUser({ username: '', password: '', name: '', role: 'staff_tester' });
        setShowAddUser(false);
        await loadStaffUsers();
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      setError('Failed to add user');
    }
  };

  const handleDeactivateUser = async (username: string) => {
    if (!confirm(`Are you sure you want to deactivate user: ${username}?`)) return;

    try {
      const sessionData = JSON.parse(localStorage.getItem('zenith_session') || '{}');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          action: 'deactivate',
          targetUsername: username
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadStaffUsers();
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      setError('Failed to deactivate user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Master Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome, {session?.user.name} | Role: {session?.features.roleName}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Feature Access Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Access Level</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">AI Features</h3>
            <p className="text-green-600">✓ Full Access</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">Competitive Analysis</h3>
            <p className="text-green-600">✓ Unlimited</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">GEO Optimization</h3>
            <p className="text-green-600">✓ Full Access</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">API Access</h3>
            <p className="text-green-600">✓ Unlimited</p>
          </div>
        </div>
      </div>

      {/* Staff Users Management */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Staff Users</h2>
          <button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Staff User
          </button>
        </div>

        {showAddUser && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <form onSubmit={handleAddUser} className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({...prev, username: e.target.value}))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({...prev, name: e.target.value}))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({...prev, role: e.target.value}))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="staff_tester">Staff Tester</option>
                <option value="enterprise">Enterprise User</option>
                <option value="professional">Professional User</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Last Login</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffUsers.map((user) => (
                <tr key={user.username} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.active && (
                      <button
                        onClick={() => handleDeactivateUser(user.username)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Login Time</th>
                <th className="text-left py-3 px-4">Last Activity</th>
                <th className="text-left py-3 px-4">Expires</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((session) => (
                <tr key={session.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{session.username}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      {session.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">{new Date(session.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4">{new Date(session.lastActivity).toLocaleString()}</td>
                  <td className="py-3 px-4">{new Date(session.expiresAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}