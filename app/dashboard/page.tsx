'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const handleSignOut = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-sm border border-gray-100">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Hi, Wanjiku Njoroge</h1>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Active Account
            </span>
          </div>
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            #12
          </span>
        </div>

        {/* Available Balance Card */}
        <div className="bg-blue-600 text-white rounded-2xl p-5 mb-6 shadow-sm">
          <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">Available Balance</p>
          <h2 className="text-3xl font-extrabold mt-1">KES 0.00</h2>
        </div>

        {/* Withdraw to M-Pesa Button (Added here!) */}
        <div className="mb-6">
          <Link
            href="/dashboard/withdraw"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-center block transition shadow-sm text-sm"
          >
            Withdraw to M-Pesa
          </Link>
        </div>

        {/* Available Money Tasks */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Available Money Tasks</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Market Opinion Survey</p>
                <p className="text-xs text-gray-500 mt-0.5">Takes ~3 mins (CPALead)</p>
              </div>
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                + KES 15
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Watch Partner Video</p>
                <p className="text-xs text-gray-500 mt-0.5">30-second ad view</p>
              </div>
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                + KES 5
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Invite a Friend</p>
                <p className="text-xs text-gray-500 mt-0.5">Share your code</p>
              </div>
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                + KES 20
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-2xl text-center transition text-sm"
        >
          Sign Out
        </button>

      </div>
    </div>
  );
}
