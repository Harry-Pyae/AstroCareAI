import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-medium no-underline transition-[color,background-color,border-color,opacity,transform] duration-[var(--dur-base)] disabled:cursor-not-allowed disabled:opacity-60';
const variants: Record<ButtonVariant, string> = {
  primary: 'border-accent bg-accent text-on-accent hover:opacity-90',
  secondary: 'border-default bg-card-raised text-primary hover:border-strong aria-pressed:border-accent aria-pressed:text-accent',
  ghost: 'border-transparent bg-transparent text-secondary hover:bg-card-raised hover:text-primary',
  danger: 'border-danger bg-transparent text-danger hover:bg-danger/10',
};
const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4',
  sm: 'min-h-9 px-3',
};

/** Shared classes so links (<Link>, <a>) can look identical to buttons. */
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra = '') {
  // Primary actions keep the full 44px target.
  const effectiveSize = variant === 'primary' ? 'md' : size;
  return `${base} ${variants[variant]} ${sizes[effectiveSize]} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export default function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
