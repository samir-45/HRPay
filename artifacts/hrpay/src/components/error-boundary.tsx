import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center"
          style={{ background: "hsl(220 20% 96%)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex size-16 items-center justify-center rounded-full"
              style={{ background: "hsl(82 80% 48% / 0.12)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: "hsl(82 80% 38%)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page. If the problem persists,
              contact support.
            </p>
            {this.state.error && (
              <details className="mt-2 max-w-md text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "hsl(82 80% 48%)" }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.assign("/")}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Go to home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
