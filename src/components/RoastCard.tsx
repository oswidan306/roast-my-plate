import clsx from 'clsx'
import type { ReactNode } from 'react'

interface RoastCardProps {
  heading: string
  children: ReactNode
  accent?: 'gold' | 'coral'
}

export function RoastCard({ heading, children, accent = 'gold' }: RoastCardProps) {
  return (
    <article className={clsx('roast-card', `roast-card--${accent}`)}>
      <p className="roast-card__eyebrow">Chef&apos;s Verdict</p>
      <h2 className="roast-card__heading">{heading}</h2>
      <p className="roast-card__body">{children}</p>
    </article>
  )
}

