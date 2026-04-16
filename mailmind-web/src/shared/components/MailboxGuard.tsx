import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

/**
 * Wraps routes that require at least one ACTIVE mailbox account.
 * Must be used inside ProtectedRoute (assumes authenticated).
 */
export function MailboxGuard({ children }: { children: ReactNode }) {
  const { status, hasActiveMailbox } = useAuth();

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (!hasActiveMailbox) return <Navigate to="/connect-email" replace />;

  return <>{children}</>;
}
