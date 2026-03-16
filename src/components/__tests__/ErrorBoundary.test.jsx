import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';

function BrokenChild() {
  throw new Error('Test error message');
}

function GoodChild() {
  return <div>OK Content</div>;
}

describe('ErrorBoundary', () => {
  // Suppress React error boundary console output during tests
  const originalConsoleError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = originalConsoleError; });

  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>);
    expect(screen.getByText('OK Content')).toBeTruthy();
  });

  it('renders error message when child throws', () => {
    render(<ErrorBoundary><BrokenChild /></ErrorBoundary>);
    expect(screen.getByText('Test error message')).toBeTruthy();
    expect(screen.getByText(/Ocorreu um erro/)).toBeTruthy();
  });

  it('has a retry button that resets the boundary', () => {
    const { container: _container } = render(<ErrorBoundary><BrokenChild /></ErrorBoundary>);
    const retryBtn = screen.getByText('Tentar novamente');
    expect(retryBtn).toBeTruthy();
    // After clicking retry, it will re-render — but BrokenChild will throw again
    fireEvent.click(retryBtn);
    // Still shows error because child still throws
    expect(screen.getByText(/Ocorreu um erro/)).toBeTruthy();
  });
});
