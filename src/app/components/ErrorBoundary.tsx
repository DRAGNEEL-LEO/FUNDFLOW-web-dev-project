import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("fundflow_auth");
      sessionStorage.removeItem("fundflow_auth_session");
      sessionStorage.removeItem("fundflow_current_page");
    } catch {}
    window.location.href = window.location.origin;
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-[#09182A] text-white p-6"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Something went wrong
            </h1>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              We encountered an unexpected issue while rendering this page. You can try refreshing or resetting your session to continue.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 font-medium text-xs transition-colors cursor-pointer"
              >
                Reset Session & Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
