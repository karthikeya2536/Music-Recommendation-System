
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 mb-2">
                System Malfunction
            </h1>
            <p className="text-white/60 max-w-md mb-8">
                The Sonicstream engine encountered a critical error. Our engineers have been notified.
            </p>
            <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
            >
                Reboot System
            </button>
            {this.state.error && (
                <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 text-left max-w-lg overflow-auto max-h-48 scrollbar-hide">
                    <code className="text-xs text-red-400 font-mono">
                        {this.state.error.toString()}
                    </code>
                </div>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}
