'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Suggestion } from '@/lib/ai/predictor';
import PriceTrendsChart from '@/components/PriceTrendsChart';

// ─── Types ──────────────────────────────────────────────────────

interface AiAssistPanelProps {
  fields: Record<string, any>;
  onAcceptSuggestion: (fieldKey: string, value: string) => void;
  onAcceptFloorSuggestion: (floorId: string, fieldName: string, value: string) => void;
  onAcceptAll: (suggestions: Record<string, Suggestion>) => void;
  isReadOnly?: boolean;
}

interface ApiResponse {
  suggestions: Record<string, Suggestion>;
  filledCount: number;
  totalFields: number;
  overallConfidence: number;
  narrative: string;
}

// ─── Component ──────────────────────────────────────────────────

export default function AiAssistPanel({
  fields,
  onAcceptSuggestion,
  onAcceptFloorSuggestion,
  onAcceptAll,
  isReadOnly,
}: AiAssistPanelProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(false);
  const [filledCount, setFilledCount] = useState(0);
  const [totalFields, setTotalFields] = useState(0);
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFieldsHash = useRef<string>('');

  // Simple hash to detect field changes
  const computeFieldsHash = useCallback((f: Record<string, any>) => {
    const keys = ['propertyType', 'city', 'pincode', 'classOfLocality', 'vicinity',
      'structureType', 'ageOfProperty', 'ageOfPropertyActual', 'premisesType',
      'landArea', 'landAreaUnit', 'approachRoadWidth', 'marketability',
      'realizablePct', 'estimatedFutureLife', 'qualityOfConstruction',
      'govtLandRate', 'landRatePerUnit', 'distressPct'];
    const vals = keys.map(k => `${k}=${f[k] || ''}`).join('|');
    const floorHash = Array.isArray(f.floors) 
      ? f.floors.map((fl: any) => `${fl.area}_${fl.rate}_${fl.lifeYears}_${fl.ageYears}_${fl.depreciationPct}`).join(',')
      : '';
    return vals + '||' + floorHash;
  }, []);

  // Fetch suggestions from API (debounced)
  const fetchSuggestions = useCallback(async (currentFields: Record<string, any>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/valuation-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: currentFields }),
      });

      if (!res.ok) throw new Error('API error');

      const data: ApiResponse = await res.json();
      setSuggestions(data.suggestions);
      setNarrative(data.narrative || '');
      setFilledCount(data.filledCount);
      setTotalFields(data.totalFields);
      setOverallConfidence(data.overallConfidence);
    } catch (err) {
      console.error('AI Assist fetch failed:', err);
    }
    setLoading(false);
  }, []);

  // Auto-trigger on field changes (debounced 2s)
  useEffect(() => {
    const hash = computeFieldsHash(fields);
    if (hash === lastFieldsHash.current) return;
    lastFieldsHash.current = hash;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(fields);
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fields, computeFieldsHash, fetchSuggestions]);

  // Filter out dismissed suggestions
  const activeSuggestions = Object.entries(suggestions).filter(
    ([key]) => !dismissed.has(key)
  );

  // Group by section
  const groupedBySection = activeSuggestions.reduce<Record<number, [string, Suggestion][]>>((acc, entry) => {
    const section = entry[1].section;
    if (!acc[section]) acc[section] = [];
    acc[section].push(entry);
    return acc;
  }, {});

  const sectionNames: Record<number, string> = {
    5: 'Structural Details',
    7: 'Building Valuation',
    8: 'Land Valuation',
    9: 'Abstract of Valuation',
  };

  const handleAccept = (key: string, suggestion: Suggestion) => {
    // Floor-level fields: key format is "floor_{id}_{fieldName}"
    const floorMatch = key.match(/^floor_(.+)_(rate|lifeYears|depreciationPct|ageYears)$/);
    if (floorMatch) {
      onAcceptFloorSuggestion(floorMatch[1], floorMatch[2], suggestion.value);
    } else {
      onAcceptSuggestion(key, suggestion.value);
    }
    setDismissed(prev => new Set(prev).add(key));
  };

  const handleDismiss = (key: string) => {
    setDismissed(prev => new Set(prev).add(key));
  };

  const handleAcceptAll = () => {
    const toAccept: Record<string, Suggestion> = {};
    for (const [key, s] of activeSuggestions) {
      toAccept[key] = s;
    }
    onAcceptAll(toAccept);
    setDismissed(prev => {
      const next = new Set(prev);
      activeSuggestions.forEach(([key]) => next.add(key));
      return next;
    });
  };

  const handleRefresh = () => {
    setDismissed(new Set());
    fetchSuggestions(fields);
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-green-600';
    if (c >= 0.6) return 'text-yellow-600';
    return 'text-orange-500';
  };

  const confidenceBg = (c: number) => {
    if (c >= 0.8) return 'bg-green-50 border-green-200';
    if (c >= 0.6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  const sourceIcon = (source: string) => {
    switch (source) {
      case 'calculated': return '🔢';
      case 'heuristic': return '📊';
      case 'ml': return '🧠';
      case 'llm': return '💬';
      default: return '✨';
    }
  };

  if (isReadOnly) return null;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl flex items-center justify-center text-xl hover:scale-105 transition-transform"
        title="AI Assist"
      >
        {panelOpen ? '✕' : '✨'}
      </button>

      {/* Panel */}
      <div
        className={`
          ${panelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none lg:translate-x-full'}
          fixed lg:sticky top-0 right-0 lg:top-4
          w-[340px] h-screen lg:h-[calc(100vh-2rem)]
          bg-white border-l lg:border border-[#e2e4e9] lg:rounded-2xl
          shadow-2xl lg:shadow-lg
          overflow-y-auto overflow-x-hidden
          transition-all duration-300 ease-out
          z-40
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-indigo-50 to-white border-b border-indigo-100 p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                ✨
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f2038]">AI Assist</h3>
                <p className="text-[10px] text-[#6c757d]">Order-independent predictions</p>
              </div>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-xs text-[#adb5bd] hover:text-[#0f2038] transition-colors lg:block hidden"
            >
              ✕
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex-1 bg-indigo-100/50 rounded-lg p-2 text-center">
              <span className="font-bold text-indigo-700 text-sm">{filledCount}</span>
              <span className="text-[#6c757d]">/{totalFields} filled</span>
            </div>
            <div className="flex-1 bg-purple-100/50 rounded-lg p-2 text-center">
              <span className="font-bold text-purple-700 text-sm">{activeSuggestions.length}</span>
              <span className="text-[#6c757d]"> suggestions</span>
            </div>
            <div className="flex-1 bg-green-100/50 rounded-lg p-2 text-center">
              <span className={`font-bold text-sm ${confidenceColor(overallConfidence)}`}>
                {Math.round(overallConfidence * 100)}%
              </span>
              <span className="text-[#6c757d]"> confidence</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${totalFields > 0 ? (filledCount / totalFields) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          {/* Price & Demand Trends Graph */}
          <PriceTrendsChart
            locality={fields.classOfLocality || fields.city || "Local Market"}
            propertyType={fields.propertyType || "Property"}
            currentGovtRate={parseFloat(fields.govtLandRate) || undefined}
            recommendedRate={parseFloat(fields.landRatePerUnit) || (suggestions.landRatePerUnit ? parseFloat(suggestions.landRatePerUnit.value) : undefined)}
          />

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              <span className="text-xs text-indigo-600 font-medium">Analyzing fields...</span>
            </div>
          )}

          {!loading && activeSuggestions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm text-[#6c757d] font-medium">
                {filledCount < 3 ? 'Fill a few more fields to get AI suggestions' : 'All suggestions accepted or no predictions available'}
              </p>
              <p className="text-[10px] text-[#adb5bd] mt-1">
                Fill any fields in any order — AI adapts automatically
              </p>
            </div>
          )}

          {/* Suggestions grouped by section */}
          {Object.entries(groupedBySection)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([sectionNum, entries]) => (
              <div key={sectionNum} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider">
                    Section {sectionNum}: {sectionNames[Number(sectionNum)] || ''}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {entries.map(([key, suggestion]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${confidenceBg(suggestion.confidence)}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{sourceIcon(suggestion.source)}</span>
                        <span className="text-xs font-semibold text-[#0f2038]">{suggestion.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${confidenceColor(suggestion.confidence)}`}>
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono font-bold text-indigo-700 bg-white/60 px-2 py-0.5 rounded">
                        {suggestion.value}
                      </code>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleAccept(key, suggestion)}
                          className="px-2.5 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold transition-colors shadow-sm"
                          title="Accept suggestion"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleDismiss(key)}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-gray-100 text-[#6c757d] text-[10px] font-bold border border-gray-200 transition-colors"
                          title="Dismiss suggestion"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* LLM Narrative */}
          {narrative && (
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs">💬</span>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">AI Analysis</span>
              </div>
              <p className="text-xs text-[#495057] leading-relaxed">{narrative}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {activeSuggestions.length > 0 && (
          <div className="sticky bottom-0 border-t border-gray-100 bg-white p-3 space-y-2">
            <button
              onClick={handleAcceptAll}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-sm"
            >
              ✨ Accept All ({activeSuggestions.length}) Suggestions
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="w-full py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#6c757d] hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              🔄 Refresh Predictions
            </button>
          </div>
        )}
      </div>
    </>
  );
}
