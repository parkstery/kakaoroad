
'use client';

import React, { useState } from 'react';
import { Location } from '../types';

interface SearchBarProps {
  onSelectLocation: (loc: Location) => void;
  placeholder: string;
  label: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectLocation, placeholder, label }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchAddress = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
        if (!window.kakao.maps.services) return;

        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(text, (data: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
            setResults(data);
            setShowDropdown(true);
        } else {
            setResults([]);
        }
        });
    });
  };

  const handleSelect = (item: any) => {
    const loc: Location = {
      lat: parseFloat(item.y),
      lng: parseFloat(item.x),
      address: item.road_address_name || item.address_name,
      name: item.place_name
    };
    onSelectLocation(loc);
    setQuery(loc.name || loc.address);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => searchAddress(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-sm"
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onFocus={() => query && setShowDropdown(true)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-[100] w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
          {results.map((item, idx) => (
            <li 
              key={idx}
              className="p-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
              onClick={() => handleSelect(item)}
            >
              <p className="text-sm font-semibold text-gray-800 truncate">{item.place_name}</p>
              <p className="text-xs text-gray-500 truncate">{item.road_address_name || item.address_name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
