'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [balance, setBalance] = useState(0.00);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hi, Wanjiku Njoroge</h1>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Active Account
            </span>
          </div>
          <span className="text-xs font-bold text-gray-400">#12</span>
        </div>

        {/* Balance Card */}
        <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-md space-y-1">
          <p className="text-xs text-blue-100 font-medium">Available Balance</p>
          <h2 className="text-3xl font-extrabold">
            KES {balance.toFixed(2)}
          </h2>
        </div>

        {/* GREEN WITHDRAW BUTTON */}
        <Link
          href="/dashboard/withdraw"
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-2xl text-center block transition shadow-md text-sm"
        >
          Withdraw to M-Pesa
        </Link>

        {/* Available Tasks */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Available Money Tasks</h3>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-800">Market Opinion Survey</p>
              <p className="text-[11px] text-gray-400">Takes ~3 mins (CPALead)</p>
            </div>
            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
              + KES 15
            </span>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-800">Watch Partner Video</p>
              <p className="text-[11px] text-gray-400">30-second ad view</p>
            </div>
            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
              + KES 5
            </span>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-800">Invite a Friend</p>
              <p className="text-[11px] text-gray-400">Share your code</p>
            </div>
            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
              + KES 20
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <button className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-bold py-3 rounded-2xl text-xs transition">
          Sign Out
        </button>

      </div>
    </div>
  );
}
