'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function WithdrawPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, amount: parseFloat(amount) }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('Withdrawal request submitted successfully! Check your M-Pesa.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Withdrawal failed. Please check your details.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
          <span className="text-xs font-bold text-gray-400">M-Pesa Cash Out</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Withdraw Funds</h1>
          <p className="text-xs text-gray-500 mt-1">Direct payout to your M-Pesa mobile number.</p>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Amount (KES)
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="10"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            />
          </div>

          {/* Status Alert */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                status === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-2xl transition text-sm shadow-md disabled:opacity-50"
          >
            {status === 'loading' ? 'Processing...' : 'Withdraw via M-Pesa'}
          </button>
        </form>

      </div>
    </div>
  );
}
