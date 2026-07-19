'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Project Page Crash:", error);
  }, [error]);

  return (
    <div className="p-12 text-center flex flex-col items-center justify-center h-full">
      <div className="bg-red-50 text-red-800 p-8 rounded-2xl max-w-2xl border border-red-200">
        <h2 className="text-2xl font-bold mb-4 font-mono">Project Page Crashed</h2>
        <p className="mb-4">Here is the exact error trace to help the developer debug:</p>
        <pre className="text-left bg-red-100 p-4 rounded-xl text-xs overflow-auto font-mono text-red-900 border border-red-200 shadow-inner">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={() => reset()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
