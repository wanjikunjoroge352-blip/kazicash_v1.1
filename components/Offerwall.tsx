'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  payoutKes: number;
  category: 'Survey' | 'App Install' | 'Sign Up';
  link: string;
}

interface OfferwallProps {
  userId?: string;
  cpaleadWallUrl?: string;
}

export default function Offerwall({ userId = 'guest', cpaleadWallUrl }: OfferwallProps) {
  const [activeTab, setActiveTab] = useState<'iframe' | 'api'>('iframe');
  const [loading, setLoading] = useState(false);

  const sampleOffers: Offer[] = [
    {
      id: '1',
      title: 'Complete Consumer Survey',
      description: 'Answer a quick 5-minute survey about shopping habits in Kenya.',
      payoutKes: 150,
      category: 'Survey',
      link: '#',
    },
    {
      id: '2',
      title: 'Download & Register App',
      description: 'Install the partner app and verify your mobile number.',
      payoutKes: 300,
      category: 'App Install',
      link: '#',
    },
    {
      id: '3',
      title: 'Sign Up for Market Insights',
      description: 'Create a free account and confirm your email address.',
      payoutKes: 110,
      category: 'Sign Up',
      link: '#',
    },
  ];

  const iframeSrc = cpaleadWallUrl 
    ? `${cpaleadWallUrl}&subid=${encodeURIComponent(userId)}`
    : null;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-yellow-300 font-semibold mb-1">
            <Sparkles className="w-5 h-5" />
            <span>Earn Real Money</span>
          </div>
          <h1 className="text-2xl font-bold">KaziCash Task Center</h1>
          <p className="text-blue-100 text-sm mt-1">
            Complete tasks, surveys, and app downloads to earn KES credited directly to your balance.
          </p>
        </div>
        
        <div className="flex bg-blue-800/60 p-1 rounded-xl border border-blue-400/30">
          <button
            onClick={() => setActiveTab('iframe')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'iframe'
                ? 'bg-white text-blue-700 shadow-md'
                : 'text-blue-100 hover:text-white'
            }`}
          >
            CPALead Wall
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'api'
                ? 'bg-white text-blue-700 shadow-md'
                : 'text-blue-100 hover:text-white'
            }`}
          >
            Direct Tasks
          </button>
        </div>
      </div>

      {activeTab === 'iframe' ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px] relative">
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              title="CPALead Offerwall"
              className="w-full h-[650px] border-none"
              allow="geolocation; microphone; camera"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">CPALead Approval Pending</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Once CPALead approves your account, enter your Offerwall URL in the environment variables to display live tasks here.
              </p>
              <button
                onClick={() => setActiveTab('api')}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 transition"
              >
                View Sample Tasks
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Available Tasks</h2>
            <button
              onClick={() => setLoading(true)}
              className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                      {offer.category}
                    </span>
                    <span className="text-base font-extrabold text-emerald-600">
                      +KES {offer.payoutKes.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 line-clamp-1">{offer.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {offer.description}
                  </p>
                </div>

                <a
                  href={offer.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 rounded-xl transition"
                >
                  <span>Earn KES {offer.payoutKes}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3 text-xs text-gray-500">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <p>
          Earnings are automatically verified and added to your KaziCash wallet upon task completion. Ensure all instructions are followed correctly to avoid payout delays.
        </p>
      </div>
    </div>
  );
}
