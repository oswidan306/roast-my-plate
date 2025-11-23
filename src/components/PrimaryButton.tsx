import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'ghost'
}

export function PrimaryButton({
  children,
  className,
  disabled,
  variant = 'solid',
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      className={clsx(
        'primary-button',
        variant === 'ghost' && 'primary-button--ghost',
        disabled && 'primary-button--disabled',
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}

