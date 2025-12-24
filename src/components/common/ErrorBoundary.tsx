import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-muted-foreground mb-6">
              نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="default">
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                العودة للرئيسية
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-right bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium">
                  تفاصيل الخطأ (للمطورين)
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
