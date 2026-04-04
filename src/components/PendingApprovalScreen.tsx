import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function PendingApprovalScreen() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-premium-lg max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Approval</h1>
          <p className="text-gray-600 mb-4">
            Your access request has been sent to the admin.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Signed in as:</strong><br />
              {user?.email}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            You'll receive an email notification once your request is approved.
          </p>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
