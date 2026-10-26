import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Lock, Filter, CheckCircle2 } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function DictionaryView() {
  const [dictionary, setDictionary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl('/api/features/dictionary'))
      .then(res => res.json())
      .then(data => {
        setDictionary(data.dictionary || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Dictionary fetch error:', err);
        setLoading(false);
      });
  }, []);

  const filteredFeatures = dictionary.filter(item => {
    const matchesSearch = 
      item.feature_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (categoryFilter === 'BANK_ONLY') return matchesSearch && item.is_bank_finalized;
    if (categoryFilter !== 'ALL') return matchesSearch && item.category === categoryFilter;
    return matchesSearch;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9E2EC] pb-6 gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
              18 BANK ANCHOR FEATURES
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">OFFICIAL BANK FEATURE DICTIONARY</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#1565C0]" />
            FEATURE DICTIONARY & SPECIFICATION
          </h1>
          <p className="text-xs text-[#5B6B7A] mt-1">
            Searchable feature dictionary based on Description.xlsx with official bank variable names and descriptions.
          </p>
        </div>

        {/* Filter Categories */}
        <div className="flex flex-wrap items-center gap-2 bg-[#F5F7FA] p-1.5 rounded-xl border border-[#D9E2EC]">
          {['ALL', 'BANK_ONLY', 'Ratio', 'UPI', 'Cash', 'Deviation', 'Account', 'Customer'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#1565C0] text-white shadow-2xs'
                  : 'text-[#5B6B7A] hover:text-[#0F2747]'
              }`}
            >
              {cat === 'BANK_ONLY' ? '18 Bank Finalized' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-2xs">
        <div className="bg-[#F5F7FA] px-4 py-2.5 rounded-xl border border-[#D9E2EC] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#7A8896]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Feature ID (e.g. F115, F531), Variable name, or keyword..."
            className="bg-transparent text-xs text-[#0F2747] placeholder:text-[#7A8896] focus:outline-none w-full font-mono font-bold"
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map((item) => (
          <div
            key={item.feature_id}
            className={`p-5 rounded-2xl border transition-all shadow-2xs ${
              item.is_bank_finalized
                ? 'bg-white border-[#1565C0]'
                : 'bg-white border-[#D9E2EC]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black font-mono text-[#1565C0]">
                {item.feature_id}
              </span>

              {item.is_bank_finalized ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" /> BANK FINALIZED
                </span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F5F7FA] text-[#5B6B7A] border border-[#D9E2EC] uppercase">
                  {item.category}
                </span>
              )}
            </div>

            <div className="text-xs font-bold text-[#0F2747] font-mono mt-2 truncate">
              {item.variable}
            </div>

            <p className="text-xs text-[#5B6B7A] mt-2 leading-relaxed font-sans">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
