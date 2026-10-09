'use client';

import React, { useState } from 'react';
import { Smartphone, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface WithdrawProps {
  userId: string;
  userBalanceKes: number;
  onSuccess?: () => void;
}

export default function WithdrawModal({ userId, userBalanceKes, onSuccess }: WithdrawProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const amountNum = parseFloat(amount);

    if (!phoneNumber.match(/^(254|0)[71]\d{8}$/)) {
      setMessage({ type: 'error', text: 'Please enter a valid Safaricom phone number (e.g., 0712345678).' });
      return;
    }

    if (isNaN(amountNum) || amountNum < 50) {
      setMessage({ type: 'error', text: 'Minimum withdrawal amount is KES 50.' });
      return;
    }

    if (amountNum > userBalanceKes) {
      setMessage({ type: 'error', text: 'Insufficient wallet balance.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amountKes: amountNum,
          phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request.');
      }

      setMessage({ type: 'success', text: 'Withdrawal request submitted! M-Pesa payout processing.' });
      setAmount('');
      setPhoneNumber('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-md w-full space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">M-Pesa Cash Out</h2>
          <p className="text-xs text-gray-500">Transfer your task earnings to your mobile wallet</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 font-extrabold text-sm px-3 py-1.5 rounded-xl border border-emerald-100">
          KES {userBalanceKes.toLocaleString()}
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleWithdraw} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">M-Pesa Phone Number</label>
          <div className="relative">
            <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (KES)</label>
          <input
            type="number"
            placeholder="Min 50 KES"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="50"
            max={userBalanceKes}
            required
            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading || userBalanceKes < 50}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Withdraw to M-Pesa</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-[11px] text-gray-400 text-center">
        Withdrawals are processed instantly or within 24 hours depending on network traffic.
      </p>
    </div>
  );
}
