import { ReactNode } from 'react';

interface FormGroupProps {
  label?: string;
  error?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormGroup({
  label,
  error,
  children,
  className = '',
}: FormGroupProps) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  );
}
