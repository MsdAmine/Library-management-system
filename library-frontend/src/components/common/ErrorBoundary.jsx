import React from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Bug } from 'lucide-react';

/**
 * Global Error Boundary — catches unexpected runtime errors anywhere in the React
 * component tree and renders a friendly fallback screen instead of a blank page.
 *
 * WCAG AA note: the fallback is focusable, uses semantic headings, and the "Reload"
 * button has a descriptive aria-label.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
    this.handleToggleDetails = this.handleToggleDetails.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  /**
   * Update state so the next render shows the fallback UI.
   * Runs during the render phase — keep it side-effect free.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Log error details (here to the console; swap for a real error-reporting
   * service such as Sentry in production).
   */
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleToggleDetails() {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, showDetails } = this.state;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950"
      >
        {/* Card */}
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600" />

          {/* Body */}
          <div className="p-8 space-y-6">
            {/* Icon + Heading */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-8 w-8 text-rose-400" aria-hidden="true" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Something went wrong
                </h1>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                  An unexpected error occurred and the application could not continue.
                  Your data is safe — please reload the page to try again.
                </p>
              </div>
            </div>

            {/* Reload Button */}
            <button
              type="button"
              onClick={this.handleReload}
              aria-label="Reload the application to recover from the error"
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-lg shadow-rose-600/25 ring-1 ring-rose-500/40 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload Application
            </button>

            {/* Collapsible Developer Details */}
            <div className="border border-slate-700/60 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={this.handleToggleDetails}
                aria-expanded={showDetails}
                aria-controls="error-details-panel"
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
              >
                <span className="flex items-center gap-2">
                  <Bug className="h-3.5 w-3.5" aria-hidden="true" />
                  Developer Details
                </span>
                {showDetails
                  ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  : <ChevronDown className="h-4 w-4" aria-hidden="true" />
                }
              </button>

              {showDetails && (
                <div
                  id="error-details-panel"
                  role="region"
                  aria-label="Error technical details"
                  className="p-4 space-y-3 bg-slate-950/50"
                >
                  {/* Error message */}
                  <div>
                    <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">
                      Error Message
                    </p>
                    <pre className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-lg border border-slate-700 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                      {error?.toString() ?? 'Unknown error'}
                    </pre>
                  </div>

                  {/* Component stack */}
                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                        Component Stack
                      </p>
                      <pre className="text-[10px] text-slate-400 font-mono bg-slate-900 p-3 rounded-lg border border-slate-700 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
