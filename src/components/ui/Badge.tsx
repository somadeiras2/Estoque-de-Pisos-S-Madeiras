import { ReactNode } from 'react';
import { StockStatus } from '@/lib/types';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'destructive' | 'info' | 'default' | 'secondary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-600' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-600' },
  danger: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-600' },
  destructive: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-600' },
  info: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-600' },
  default: { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500' },
  secondary: { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500' },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2.5 py-0.5 gap-1.5',
  md: 'text-sm px-3 py-1 gap-2',
};

export function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
  const styles = variantStyles[variant] || variantStyles.default;
  const sizeStyle = sizeStyles[size] || sizeStyles.sm;

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${styles.bg} ${styles.text} ${sizeStyle} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {children}
    </span>
  );
}

export function StockBadge({ status, size = 'sm' }: { status: StockStatus; size?: BadgeSize }) {
  switch (status) {
    case 'normal':
      return <Badge variant="success" size={size}>Estoque normal</Badge>;
    case 'baixo':
      return <Badge variant="warning" size={size}>Estoque baixo</Badge>;
    case 'critico':
      return <Badge variant="danger" size={size}>Estoque crítico</Badge>;
    case 'sem_estoque':
      return <Badge variant="danger" size={size}>Sem estoque</Badge>;
    default:
      return <Badge variant="default" size={size}>Normal</Badge>;
  }
}
