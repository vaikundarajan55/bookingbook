import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-3xl font-semibold text-ocean">This page didn’t load</h1>
        <p className="text-ink/60">Refresh the page. If it keeps happening, check your connection.</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Refresh page</button>
      </div>
    );
  }
}
