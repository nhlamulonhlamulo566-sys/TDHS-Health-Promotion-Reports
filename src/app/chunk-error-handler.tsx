
'use client';

import React from 'react';

type ChunkErrorBoundaryState = {
  hasError: boolean;
};

export default class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ChunkErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError');

    if (isChunkError) {
      console.warn('⚠️ ChunkLoadError caught by Error Boundary. Reloading...');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }

    // We still return that an error has occurred so React can render a fallback if needed,
    // although the reload should be nearly instantaneous.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service here
    console.error('Uncaught error in ChunkErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong. The page is reloading.</h1>;
    }

    return this.props.children;
  }
}
