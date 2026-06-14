import { ReactNode } from 'react';

interface ErrorMessageProps {
  children: ReactNode;
  className?: string;
}

export function ErrorMessage({
  children,
  className = '',
}: ErrorMessageProps) {
  return (
    <div className={`error-message ${className}`.trim()}>
      {children}
    </div>
  );
}
