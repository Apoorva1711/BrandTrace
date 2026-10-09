import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RiskBadge, StatusBadge } from './components/Badges';

describe('Frontend Component Tests', () => {
  it('renders login screen with BRANDTRACE wordmark and inputs', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Sign in to BRANDTRACE/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/analyst@organization.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enter Security Console/i })).toBeInTheDocument();
  });

  it('renders Critical RiskBadge correctly with score', () => {
    const { container } = render(<RiskBadge category="Critical" score={92} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('(92)')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-red-50');
  });

  it('renders Under Review StatusBadge correctly', () => {
    const { container } = render(<StatusBadge status="Under Review" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });
});
