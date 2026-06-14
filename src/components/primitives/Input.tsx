import { ForwardedRef, forwardRef } from 'react';

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef(
  (
    { error, className = '', ...props }: InputProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const baseClass = 'form-input';
    const errorClass = error ? 'error' : '';
    const classes = `${baseClass} ${errorClass} ${className}`.trim();

    return (
      <input ref={ref} className={classes} {...props} />
    );
  }
);

Input.displayName = 'Input';
