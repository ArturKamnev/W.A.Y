import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
  full?: boolean
}

export function Button({ className, variant = 'primary', full = false, ...props }: ButtonProps) {
  return <button className={clsx('button', `button--${variant}`, full && 'button--full', className)} {...props} />
}

interface LinkButtonProps extends ComponentPropsWithoutRef<'a'> {
  variant?: ButtonVariant
}

export function LinkButton({ className, variant = 'primary', ...props }: LinkButtonProps) {
  return <a className={clsx('button', `button--${variant}`, className)} {...props} />
}

export function Card({ className, ...props }: ComponentPropsWithoutRef<'article'>) {
  return <article className={clsx('card', className)} {...props} />
}

export function Badge({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span className={clsx('badge', className)} {...props} />
}

interface SectionProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  eyebrow?: ReactNode
  title?: ReactNode
  lead?: ReactNode
  compact?: boolean
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { eyebrow, title, lead, compact, children, className, ...props },
  ref,
) {
  return (
    <section ref={ref} className={clsx('section', compact && 'section--compact', className)} {...props}>
      <div className="section__inner">
        {eyebrow ? <p className="section__eyebrow">{eyebrow}</p> : null}
        {title ? <h1 className="section__title">{title}</h1> : null}
        {lead ? <p className="section__lead">{lead}</p> : null}
        {children}
      </div>
    </section>
  )
})

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return <input className={clsx('input', className)} {...props} />
}

export function Select({ className, ...props }: ComponentPropsWithoutRef<'select'>) {
  return <select className={clsx('select', className)} {...props} />
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const width = Math.max(0, Math.min(100, value))

  return (
    <div aria-label={label} aria-valuemax={100} aria-valuemin={0} aria-valuenow={width} className="progress" role="progressbar">
      <span style={{ width: `${width}%` }} />
    </div>
  )
}

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="modal card"
        initial={{ opacity: 0, y: 18 }}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal__header">
          <h2>{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            x
          </Button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="empty-state card">
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
    </div>
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="loading-state card" role="status">
      <div className="skeleton" />
      <p>{label}</p>
    </div>
  )
}

export function SuggestionChip({ className, ...props }: ComponentPropsWithoutRef<'button'>) {
  return <button className={clsx('badge', className)} type="button" {...props} />
}
