import React, { Component, ReactNode } from 'react';

interface State { hasError: boolean; error?: any }
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError:false };
  static getDerivedStateFromError(error: any){ return { hasError:true, error }; }
  componentDidCatch(error: any, info: any){ console.error('ErrorBoundary', error, info); }
  render(){
    if (this.state.hasError){
      return <div className="p-6 text-sm text-red-600 border rounded-xl bg-red-50 dark:bg-red-950/20">An unexpected error occurred.<pre className="mt-2 text-xs whitespace-pre-wrap">{String(this.state.error)}</pre><button className="mt-3 text-xs underline" onClick={()=> this.setState({ hasError:false, error:undefined })}>Retry</button></div>;
    }
    return this.props.children;
  }
}
