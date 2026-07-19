'use client';

import { useState } from 'react';
import { updateInspectionMilestone } from '@/app/actions/project';

interface InspectionClientProps {
  projectId: string;
  initialStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  initialNotes: string | null;
  initialMeasurements: any;
}

export default function InspectionClient({
  projectId,
  initialStatus,
  initialNotes,
  initialMeasurements,
}: InspectionClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes || '');
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Parse measurements/milestones
  const getInitialMilestones = () => {
    try {
      if (initialMeasurements && typeof initialMeasurements === 'object') {
        return initialMeasurements.milestones || {};
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  };

  const [milestones, setMilestones] = useState<Record<string, string>>(getInitialMilestones());

  const handleMilestoneClick = async (
    key: 'startedAt' | 'reachedSiteAt' | 'inspectedAt' | 'completedAt'
  ) => {
    setLoading(key);
    setMessage(null);

    const result = await updateInspectionMilestone(projectId, key, notes);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      if (key === 'startedAt') {
        setStatus('IN_PROGRESS');
      } else if (key === 'completedAt') {
        setStatus('COMPLETED');
      }
      
      const newMilestones = result.measurements?.milestones || {
        ...milestones,
        [key]: new Date().toISOString(),
      };
      setMilestones(newMilestones);
      setMessage({ type: 'success', text: 'Inspection milestone recorded!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(null);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Define steps
  const steps = [
    {
      key: 'startedAt',
      title: 'Start Inspection',
      subtitle: 'Triggered when you start traveling to site',
      buttonText: '🚀 Start Trip',
      completedText: 'Trip Started',
    },
    {
      key: 'reachedSiteAt',
      title: 'Reached Site',
      subtitle: 'Record when you physically arrive at location',
      buttonText: '📍 Reached Site',
      completedText: 'At Site',
      dependsOn: 'startedAt',
    },
    {
      key: 'inspectedAt',
      title: 'Inspected',
      subtitle: 'Record when property measurements are done',
      buttonText: '📐 Completed Survey',
      completedText: 'Survey Done',
      dependsOn: 'reachedSiteAt',
    },
    {
      key: 'completedAt',
      title: 'Complete Inspection',
      subtitle: 'Mark the whole inspection process as finished',
      buttonText: '✅ Mark Finished',
      completedText: 'Inspection Finished',
      dependsOn: 'inspectedAt',
    },
  ];

  return (
    <div className="card p-6 border border-[#b8860b]/20 bg-[#b8860b]/5 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#0f2038] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Inspection Milestones
        </h3>
        <p className="text-xs text-[#6c757d]">Record key milestones as they happen during your site visit.</p>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-sm border font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Vertical Interactive Timeline */}
      <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-6">
        {steps.map((step, idx) => {
          const isDone = !!milestones[step.key];
          const canTrigger = idx === 0 || (!!milestones[steps[idx - 1].key] && !isDone);
          
          return (
            <div key={step.key} className="relative">
              {/* Checkmark indicator */}
              <span className={`absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                isDone 
                  ? 'border-green-600 bg-green-600 text-white' 
                  : canTrigger 
                  ? 'border-[#b8860b] bg-white text-[#b8860b] animate-pulse' 
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}>
                {isDone ? '✓' : idx + 1}
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className={`text-sm font-bold ${isDone ? 'text-green-700' : 'text-[#0f2038]'}`}>
                    {isDone ? step.completedText : step.title}
                  </h4>
                  <p className="text-xs text-[#6c757d] mt-0.5">{step.subtitle}</p>
                  
                  {isDone && (
                    <span className="inline-flex items-center text-[10px] text-green-600 font-mono bg-green-50 px-2 py-0.5 rounded border border-green-200 mt-1.5 font-bold">
                      ⏱ {formatDate(milestones[step.key])} @ {formatTime(milestones[step.key])}
                    </span>
                  )}
                </div>

                <div>
                  {canTrigger && (
                    <button
                      onClick={() => handleMilestoneClick(step.key as any)}
                      disabled={!!loading}
                      className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#0f2038] text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
                    >
                      {loading === step.key ? 'Saving...' : step.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <hr className="border-gray-200" />

      {/* Field Notes Area */}
      <div>
        <label className="block text-sm font-medium text-[#343a40] mb-1.5">
          Field Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Type notes here. Note: saving a milestone automatically saves these notes."
          className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all resize-none"
        />
      </div>

      <p className="text-[10px] text-[#6c757d] leading-relaxed">
        * Note: Site photos should be archived locally. You do not need to upload property photos to the platform.
      </p>
    </div>
  );
}
