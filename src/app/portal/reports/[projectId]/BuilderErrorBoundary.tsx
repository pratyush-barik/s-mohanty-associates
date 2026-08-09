'use client';

import { Component, ReactNode } from 'react';

interface BuilderErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface BuilderErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class BuilderErrorBoundary extends Component<BuilderErrorBoundaryProps, BuilderErrorBoundaryState> {
  constructor(props: BuilderErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): BuilderErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Builder crashed:', error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-200 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold mb-2">Report Builder Error</h2>
            <p className="text-sm mb-4">The report builder encountered an unexpected error. This may be due to corrupted draft data.</p>
            <details className="text-left bg-white p-4 rounded-lg border border-red-100 mb-4">
              <summary className="text-xs font-bold cursor-pointer mb-2">Error Details</summary>
              <pre className="text-xs overflow-auto font-mono text-red-900">
                {this.state.error?.message}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = window.location.pathname;
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Reset Report
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
