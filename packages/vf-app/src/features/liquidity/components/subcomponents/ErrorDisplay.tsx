import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg shadow-md">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-500 flex-1">{error}</p>
      <button onClick={onDismiss} className="text-red-500 hover:text-red-600 flex-shrink-0">
        ✕
      </button>
    </div>
  );
}
