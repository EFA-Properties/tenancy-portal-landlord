import React from 'react'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-[14px] border border-abode-border bg-abode-bg2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx('px-4 py-4 border-b border-abode-border', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={clsx('px-4 py-4', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={clsx(
        'px-4 py-4 border-t border-abode-border bg-abode-bg3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
