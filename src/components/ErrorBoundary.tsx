import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  private handleClearAndReset = () => {
    try {
      localStorage.removeItem('peoria-slider-data');
    } catch {
      // ignore
    }
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px 16px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          maxWidth: 400,
          margin: '80px auto',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#333' }}>
            エラーが発生しました
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            予期しないエラーが発生しました。<br />
            再試行するか、データをリセットしてください。
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                background: '#2e7d32',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              再試行
            </button>
            <button
              onClick={this.handleClearAndReset}
              style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#d32f2f',
                border: '1px solid #d32f2f',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              データリセット
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
