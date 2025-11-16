import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                {this.props.componentName ? `${this.props.componentName} Error` : 'Something went wrong'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                {this.props.componentName
                  ? `The ${this.props.componentName} component encountered an error and couldn't render properly.`
                  : 'The application encountered an error and couldn\'t render properly.'
                }
              </p>

              {this.state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-semibold text-red-800 mb-2">Error Details:</p>
                  <pre className="text-sm text-red-600 overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-slate-700">
                    Component Stack Trace
                  </summary>
                  <pre className="text-xs text-slate-600 mt-2 overflow-auto max-h-60">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  Reload Page
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-sm text-slate-500">
                If this problem persists, please check the browser console for more details or contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
