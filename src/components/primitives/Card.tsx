import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'form';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  className = '',
}: CardProps) {
  const baseClass = 'card';
  const variantClass = variant === 'form' ? 'form-card' : '';
  const classes = `${baseClass} ${variantClass} ${className}`.trim();

  return <div className={classes}>{children}</div>;
}
