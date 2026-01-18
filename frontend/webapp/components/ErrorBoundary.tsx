import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full border border-red-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                <AlertCircle className="text-red-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
                                <p className="text-gray-500 text-sm mt-1">An error occurred while rendering this component</p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <p className="text-sm font-bold text-red-900 mb-2">Error Details:</p>
                            <p className="text-sm text-red-700 font-mono break-words">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        {this.state.errorInfo && (
                            <details className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <summary className="text-sm font-bold text-gray-700 cursor-pointer">
                                    Stack Trace
                                </summary>
                                <pre className="mt-3 text-xs text-gray-600 overflow-auto max-h-64 font-mono">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 w-full bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
