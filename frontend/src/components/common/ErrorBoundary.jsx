import React from 'react';
import { Button } from './Button';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.logError(error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  logError = (error, errorInfo) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, or your own error tracking API
    this.sendErrorToService(error, errorInfo);
  };

  sendErrorToService = (error, errorInfo) => {
    // Placeholder for error reporting service
    // You can integrate with services like:
    // - Sentry: Sentry.captureException(error, { extra: errorInfo });
    // - LogRocket: LogRocket.captureException(error);
    // - Custom API endpoint
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // For now, we'll just log it (replace with actual service call)
    console.log('Error reported to service:', errorData);
    
    // Example of sending to a custom API:
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // }).catch(err => console.error('Failed to report error:', err));
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    // Reset error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
    
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="error-icon"
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            
            <h2 className="error-boundary__title">
              Oops! Something went wrong
            </h2>
            
            <p className="error-boundary__message">
              We're sorry, but something unexpected happened. Our team has been notified 
              and we're working to fix this issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-boundary__error-info">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="error-boundary__actions">
              <Button 
                onClick={this.handleRetry}
                variant="primary"
                className="error-boundary__retry-btn"
              >
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="secondary"
                className="error-boundary__home-btn"
              >
                Go Home
              </Button>
            </div>

            {this.state.retryCount > 0 && (
              <p className="error-boundary__retry-count">
                Retry attempt: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
