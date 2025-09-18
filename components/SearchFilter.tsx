// components/SearchFilter.tsx
"use client";

import { useState } from "react";

interface SearchFilterProps {
  onSearch: (filters: {
    date?: string;
    hn?: string;
    name?: string;
  }) => void;
}

export default function SearchFilter({ onSearch }: SearchFilterProps) {
  const [date, setDate] = useState("");
  const [hn, setHn] = useState("");
  const [name, setName] = useState("");

  const handleSearch = () => {
    onSearch({
      date: date || undefined,
      hn: hn || undefined,
      name: name || undefined,
    });
  };

  const handleReset = () => {
    setDate("");
    setHn("");
    setName("");
    onSearch({});
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          วันที่
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          HN
        </label>
        <input
          type="text"
          value={hn}
          onChange={(e) => setHn(e.target.value)}
          placeholder="HN"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ชื่อ
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อผู้ป่วย"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            ค้นหา
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            ล้าง
          </button>
        </div>
      </div>
    </div>
  );
}