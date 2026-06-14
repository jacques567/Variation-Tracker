import { ReactNode } from 'react';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = 'button';
  const variantClass = variant === 'secondary' ? 'secondary' : '';
  const classes = `${baseClass} ${variantClass} ${className}`.trim();

  return (
    <button className={classes} {...props} />
  );
}
