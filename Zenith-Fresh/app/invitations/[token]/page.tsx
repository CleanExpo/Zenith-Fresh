'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Invitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  team: {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    _count: {
      members: number;
    };
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  expiresAt: string;
}

export default function InvitationPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invitation not found or invalid');
        } else if (response.status === 410) {
          throw new Error('This invitation has expired or is no longer valid');
        }
        throw new Error('Failed to fetch invitation');
      }
      
      const data = await response.json();
      setInvitation(data.invitation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      setSuccess('Invitation accepted! Redirecting to team...');
      setTimeout(() => {
        router.push(`/teams/${invitation?.team.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline invitation');
      }

      setSuccess('Invitation declined.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MEMBER':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-green-500 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-green-800 text-lg font-medium">{success}</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Invitation not found.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const emailMismatch = session?.user?.email && session.user.email !== invitation.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Team Info */}
        <div className="text-center mb-8">
          {invitation.team.avatar ? (
            <img
              src={invitation.team.avatar}
              alt={invitation.team.name}
              className="mx-auto w-16 h-16 rounded-lg object-cover mb-4"
            />
          ) : (
            <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">
                {invitation.team.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're invited to join
          </h1>
          <h2 className="text-xl font-semibold text-blue-600 mb-2">
            {invitation.team.name}
          </h2>
          {invitation.team.description && (
            <p className="text-gray-600 mb-4">{invitation.team.description}</p>
          )}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>{invitation.team._count.members} members</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(invitation.role)}`}>
              {invitation.role} role
            </span>
          </div>
        </div>

        {/* Invitation Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-xs font-medium">
                {invitation.inviter.name?.charAt(0) || invitation.inviter.email.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {invitation.inviter.name || invitation.inviter.email}
              </p>
              <p className="text-xs text-gray-500">invited you to join</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <p>Invited on {new Date(invitation.createdAt).toLocaleDateString()}</p>
            <p>Expires on {new Date(invitation.expiresAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Error Messages */}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            <p className="text-red-800 text-sm">This invitation has expired.</p>
          </div>
        )}

        {emailMismatch && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
            <p className="text-yellow-800 text-sm">
              This invitation was sent to {invitation.email}, but you're signed in as {session?.user?.email}.
              Please sign in with the correct account or contact the team admin.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        {!session?.user ? (
          <div className="space-y-3">
            <p className="text-center text-gray-600 text-sm mb-4">
              Sign in to accept this invitation
            </p>
            <Link
              href="/auth/signin"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center block"
            >
              Sign In
            </Link>
          </div>
        ) : isExpired || emailMismatch ? (
          <div className="text-center">
            <Link
              href="/teams"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Go to Teams
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Accept Invitation'
              )}
            </button>
            <button
              onClick={handleDecline}
              disabled={actionLoading}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}