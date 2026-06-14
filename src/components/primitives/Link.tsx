import { ReactNode } from 'react';

interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

export function Link({
  className = '',
  ...props
}: LinkProps) {
  const classes = `link ${className}`.trim();

  return <a className={classes} {...props} />;
}
