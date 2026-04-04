import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';
import PendingApprovalScreen from './PendingApprovalScreen';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, session, loading, isApproved, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-travel-teal mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!session || !user) {
    return <LoginPage />;
  }

  // Signed in but not approved
  if (!isApproved) {
    if (user.status === 'rejected') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="bg-white p-8 rounded-2xl shadow-premium-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                Your access request has been rejected. Please contact the administrator.
              </p>
              <button
                onClick={signOut}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <PendingApprovalScreen />;
  }

  // Approved - show app
  return <>{children}</>;
}
