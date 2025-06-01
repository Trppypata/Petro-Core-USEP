import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Map Error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-[600px] w-full bg-gray-100 rounded-3xl flex flex-col items-center justify-center p-4">
          <h3 className="text-xl font-semibold mb-2">Map could not be loaded</h3>
          <p className="text-gray-600 mb-4 text-center">
            There was an issue loading the interactive map. 
            You can still access individual rock details from the main page.
          </p>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary; 