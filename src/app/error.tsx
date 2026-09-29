'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an API endpoint so we can see it on the server console!
    console.error(error);
    fetch('/api/webhooks/test', {
      method: 'POST',
      body: JSON.stringify({ message: error.message, stack: error.stack }),
    }).catch(console.error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-red-500 p-8 text-left font-mono">
      <h2 className="text-2xl font-bold mb-4">Client Runtime Error</h2>
      <div className="bg-slate-900 p-4 rounded text-sm w-full max-w-4xl overflow-auto">
        <p className="font-bold">{error.message}</p>
        <pre className="mt-4 whitespace-pre-wrap">{error.stack}</pre>
      </div>
      <button
        onClick={() => reset()}
        className="mt-8 px-4 py-2 bg-slate-800 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
