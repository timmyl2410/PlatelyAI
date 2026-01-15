import React from 'react';
import { Link } from 'react-router-dom';

type State = {
  hasError: boolean;
  error?: Error | null;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error } as State;
  }

  componentDidCatch(error: Error, info: any) {
    // Log the error to console for now — could integrate Sentry/Analytics
    // eslint-disable-next-line no-console
    console.error('Unhandled error caught by ErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAF7] p-6">
          <div className="max-w-xl w-full bg-white rounded-2xl p-8 shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">An unexpected error occurred while rendering this page.</p>
            <div className="flex gap-3justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#2ECC71] text-white rounded-xl"
              >
                Reload Page
              </button>
              <Link to="/" className="px-4 py-2 border border-gray-300 rounded-xl">
                Back Home
              </Link>
            </div>
            <pre className="mt-4 text-xs text-gray-400 text-left overflow-auto max-h-40">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children as JSX.Element;
  }
}

export default ErrorBoundary;
