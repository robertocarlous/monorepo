import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ChartErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ChartErrorState({
  title = "Failed to load",
  message = "This chart couldn't load. Check your connection and try again.",
  onRetry,
}: ChartErrorStateProps) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center border-2 border-dashed border-red-300 bg-red-50/50 font-mono text-sm p-6 text-center"
      role="alert"
    >
      <AlertTriangle className="w-8 h-8 mb-2 text-red-500" aria-hidden="true" />
      <p className="font-bold text-red-700 mb-1">{title}</p>
      <p className="text-xs text-red-600/80 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 border-2 border-red-300 bg-white text-red-700 px-3 py-1.5 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(220,38,38,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(220,38,38,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}
