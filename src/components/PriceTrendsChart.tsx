"use client";

import React, { useState } from 'react';

export interface TrendPoint {
  year: string;
  avgRate: number; // ₹ per sqft
  demandIndex: number; // 0-100 scale
}

interface PriceTrendsChartProps {
  locality: string;
  propertyType: string;
  data?: TrendPoint[];
  currentGovtRate?: number;
  recommendedRate?: number;
}

export default function PriceTrendsChart({
  locality = "Class A Locality",
  propertyType = "Residential",
  data,
  currentGovtRate,
  recommendedRate,
}: PriceTrendsChartProps) {
  const [activeTab, setActiveTab] = useState<'rate' | 'demand'>('rate');

  // Default historical & projected trend data if none provided
  const trendData: TrendPoint[] = data || [
    { year: '2021', avgRate: 3200, demandIndex: 65 },
    { year: '2022', avgRate: 3600, demandIndex: 72 },
    { year: '2023', avgRate: 4100, demandIndex: 80 },
    { year: '2024', avgRate: 4750, demandIndex: 85 },
    { year: '2025 (Est)', avgRate: 5300, demandIndex: 90 },
  ];

  const maxRate = Math.max(...trendData.map(d => d.avgRate), (recommendedRate || 0) * 1.1, 6000);
  const minRate = Math.min(...trendData.map(d => d.avgRate)) * 0.8;

  // Chart rendering helpers
  const svgWidth = 300;
  const svgHeight = 130;
  const padding = 25;
  const graphWidth = svgWidth - padding * 2;
  const graphHeight = svgHeight - padding * 2;

  const points = trendData.map((d, index) => {
    const x = padding + (index / (trendData.length - 1)) * graphWidth;
    const val = activeTab === 'rate' ? d.avgRate : d.demandIndex;
    const min = activeTab === 'rate' ? minRate : 0;
    const max = activeTab === 'rate' ? maxRate : 100;
    const y = svgHeight - padding - ((val - min) / (max - min)) * graphHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg border border-slate-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Market Intelligence</span>
          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            📈 Property Trends ({locality || 'General Area'})
          </h4>
        </div>
        <div className="flex bg-slate-800 p-0.5 rounded-lg text-[10px]">
          <button
            onClick={() => setActiveTab('rate')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'rate' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rate/SqFt
          </button>
          <button
            onClick={() => setActiveTab('demand')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'demand' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Demand Index
          </button>
        </div>
      </div>

      {/* SVG Line Graph */}
      <div className="relative pt-2">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, i) => {
            const y = padding + ratio * graphHeight;
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={svgWidth - padding}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Trend Line */}
          <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#0f172a"
                stroke="#f59e0b"
                strokeWidth="2"
                className="transition-all duration-200 group-hover:r-6 group-hover:fill-amber-400"
              />
              <text
                x={pt.x}
                y={svgHeight - 8}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-medium"
              >
                {pt.year}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Benchmark Badges */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px]">
        {currentGovtRate ? (
          <div className="bg-slate-800/70 rounded-lg p-2 flex flex-col">
            <span className="text-slate-400">Govt. Circle Rate</span>
            <span className="font-semibold text-emerald-400">₹{currentGovtRate.toLocaleString()}/sqft</span>
          </div>
        ) : (
          <div className="bg-slate-800/70 rounded-lg p-2 flex flex-col">
            <span className="text-slate-400">Avg. Annual Growth</span>
            <span className="font-semibold text-emerald-400">+12.4% YoY</span>
          </div>
        )}

        {recommendedRate ? (
          <div className="bg-slate-800/70 rounded-lg p-2 flex flex-col">
            <span className="text-slate-400">Recommended Rate</span>
            <span className="font-semibold text-amber-400">₹{recommendedRate.toLocaleString()}/sqft</span>
          </div>
        ) : (
          <div className="bg-slate-800/70 rounded-lg p-2 flex flex-col">
            <span className="text-slate-400">Market Liquidity</span>
            <span className="font-semibold text-amber-400">High Demand</span>
          </div>
        )}
      </div>
    </div>
  );
}
