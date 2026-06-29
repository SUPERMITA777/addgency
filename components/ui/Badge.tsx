import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-[2px] font-semibold border';

  const variantStyles = {
    success: 'bg-success/15 text-success border-success/35',
    danger: 'bg-danger/15 text-danger border-danger/35',
    warning: 'bg-warning/15 text-warning border-warning/35',
    info: 'bg-accent/15 text-accent border-accent/35',
    default: 'bg-border/30 text-muted border-border',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
export default Badge;
