import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../../components/Toast';

function ToastTrigger({ message, type }) {
  const showToast = useToast();
  return <button onClick={() => showToast(message, type)}>Trigger</button>;
}

describe('Toast', () => {
  it('renders ToastProvider without crashing', () => {
    render(<ToastProvider><div>child</div></ToastProvider>);
    expect(screen.getByText('child')).toBeTruthy();
  });

  it('shows toast message when triggered', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Salvo com sucesso" type="success" />
      </ToastProvider>
    );
    act(() => { screen.getByText('Trigger').click(); });
    expect(screen.getByText('Salvo com sucesso')).toBeTruthy();
  });

  it('shows error toast', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Erro ao salvar" type="error" />
      </ToastProvider>
    );
    act(() => { screen.getByText('Trigger').click(); });
    expect(screen.getByText('Erro ao salvar')).toBeTruthy();
  });

  it('useToast throws outside provider', () => {
    const BrokenComponent = () => { useToast(); return null; };
    expect(() => render(<BrokenComponent />)).toThrow('useToast must be used within ToastProvider');
  });
});
