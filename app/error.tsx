'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100">
            Something went wrong!
          </h2>
        </div>

        <p className="text-gray-400 mb-4">
          An unexpected error occurred. Please try again.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
            <p className="text-xs text-gray-500 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-600 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <button
          onClick={reset}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
