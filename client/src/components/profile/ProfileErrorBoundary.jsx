import { Component } from "react";
import { FaExclamationTriangle, FaSync } from "react-icons/fa";

class ProfileErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
          <div className="text-center">
            <div className="p-4 bg-red-500/20 text-red-400 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FaExclamationTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-400 mb-6">
              {this.props.fallbackMessage ||
                "An error occurred while loading this component. Please try again."}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaSync className="w-4 h-4" />
                Try Again
              </button>
              {this.props.onError && (
                <button
                  onClick={() => this.props.onError(this.state.error)}
                  className="px-4 py-2 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Report Issue
                </button>
              )}
            </div>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-4 bg-neutral-800/50 rounded-lg text-xs text-gray-400 font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error?.toString()}
                  </div>
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProfileErrorBoundary;
