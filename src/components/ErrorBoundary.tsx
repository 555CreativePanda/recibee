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
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
          <div className="bg-white border border-kitchen-border p-10 max-w-md w-full rounded-3xl shadow-2xl">
            <div className="flex items-center gap-5 mb-8">
              <div className="p-4 bg-red-50 rounded-2xl">
                <AlertTriangle className="text-red-500" size={36} />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-kitchen-text tracking-tight">Kitchen Mishap</h1>
                <p className="text-[10px] font-bold text-kitchen-muted uppercase tracking-widest mt-1">Error Code: 0x500</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-stone-50 p-5 rounded-2xl border-l-4 border-red-500">
                <p className="text-sm text-kitchen-muted leading-relaxed font-medium">
                  Something went wrong in the kitchen. We've preserved the current state so you don't lose your progress.
                </p>
              </div>

              {this.state.error && (
                <div className="bg-stone-50 p-4 rounded-xl border border-kitchen-border font-mono text-[10px] text-red-600 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-kitchen-text px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                >
                  <RefreshCw size={16} />
                  Reload
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center justify-center gap-2 bg-kitchen-primary hover:bg-orange-700 text-white px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-100 active:scale-95"
                >
                  <Home size={16} />
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
