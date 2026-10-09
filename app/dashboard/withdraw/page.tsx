'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WithdrawPage() {
  const [balance, setBalance] = useState<number>(55.00);
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch('/api/user/balance');
        const data = await res.json();
        if (data.balance !== undefined) setBalance(data.balance);
      } catch (e) {
        console.error('Failed to load balance', e);
      }
    }
    fetchBalance();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const withdrawAmount = parseFloat(amount);

    if (!phone || phone.length < 10) {
      setMessage({ text: 'Please enter a valid M-Pesa phone number (e.g., 2547XXXXXXXX)', type: 'error' });
      setLoading(false);
      return;
    }

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setMessage({ text: 'Please enter a valid withdrawal amount', type: 'error' });
      setLoading(false);
      return;
    }

    if (withdrawAmount > balance) {
      setMessage({ text: 'Insufficient balance for this withdrawal amount', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: withdrawAmount }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'Withdrawal request successful! Check your phone for the M-Pesa prompt.', type: 'success' });
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        setMessage({ text: data.error || 'Withdrawal failed. Please try again.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Withdraw to M-Pesa</h1>
          <Link href="/dashboard" className="text-xs font-semibold text-blue-600 hover:underline">
            Back
          </Link>
        </div>

        {/* Balance Card Summary */}
        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-md space-y-1">
          <p className="text-xs text-blue-100 font-medium">Available to Withdraw</p>
          <h2 className="text-2xl font-extrabold">KES {balance.toFixed(2)}</h2>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`p-3 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Withdrawal Form */}
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">M-Pesa Phone Number</label>
            <input
              type="text"
              placeholder="2547XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Amount (KES)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-center block transition shadow-md text-sm disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </form>

      </div>
    </div>
  );
}
