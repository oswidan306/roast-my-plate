import type { ReactNode } from 'react'
import clsx from 'clsx'

interface ScreenShellProps {
  id?: string
  background?: 'splash' | 'upload' | 'loading' | 'table' | 'dark' | 'canvas'
  children: ReactNode
  padded?: boolean
}

const backgroundClass: Record<
  NonNullable<ScreenShellProps['background']>,
  string
> = {
  splash: 'screen-shell--splash',
  upload: 'screen-shell--upload',
  loading: 'screen-shell--loading',
  table: 'screen-shell--table',
  dark: 'screen-shell--dark',
  canvas: 'screen-shell--canvas',
}

export function ScreenShell({
  id,
  background = 'canvas',
  padded = true,
  children,
}: ScreenShellProps) {
  return (
    <section
      id={id}
      className={clsx('screen-shell', backgroundClass[background], padded && 'screen-shell--padded')}
    >
      {children}
    </section>
  )
}

