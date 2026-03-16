import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import LoadingScreen from '../../components/LoadingScreen';

describe('LoadingScreen', () => {
  it('renders loading text', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Carregando...')).toBeTruthy();
  });

  it('does not show slow message initially', () => {
    render(<LoadingScreen />);
    expect(screen.queryByText(/conexão está demorando/)).toBeNull();
  });

  it('shows slow message after timeout', async () => {
    vi.useFakeTimers();
    render(<LoadingScreen />);
    act(() => { vi.advanceTimersByTime(5100); });
    expect(screen.getByText(/conexão está demorando/)).toBeTruthy();
    vi.useRealTimers();
  });
});
