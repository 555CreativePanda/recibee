import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { children } = this.props;
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-carbon-gray-100 flex items-center justify-center p-6">
          <div className="bg-carbon-gray-90 border border-carbon-gray-80 p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-900/20 rounded-full">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight">System Error</h1>
                <p className="text-xs font-mono text-carbon-gray-40 uppercase tracking-widest">Error Code: 0x500</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-carbon-gray-100 p-4 border-l-2 border-red-500">
                <p className="text-sm text-carbon-gray-30 leading-relaxed">
                  An unexpected error has occurred in the application repository. The system state has been preserved for diagnostic purposes.
                </p>
              </div>

              {this.state.error && (
                <div className="bg-black/40 p-3 rounded font-mono text-[10px] text-red-400 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 bg-carbon-gray-80 hover:bg-carbon-gray-70 text-white px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <RefreshCw size={14} />
                  Reload
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center justify-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <Home size={14} />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
